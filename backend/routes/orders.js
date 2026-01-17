import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { sendWhatsAppMessage } from '../whatsapp.js';
import { logAudit } from '../utils/audit.js';
import { sendEmail } from '../utils/email.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// JSON fallback helpers
const getOrdersFile = () => path.join(__dirname, '../data/orders.json');
const readOrders = () => {
  try {
    const filePath = getOrdersFile();
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch { return []; }
};
const writeOrders = (orders) => {
  try {
    const filePath = getOrdersFile();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
  } catch (err) { console.error('Error writing orders file:', err); }
};

// Create Order
router.post('/', async (req, res) => {
  const { customer_name, customer_email, customer_phone, items, total_amount, payment_method, notes, player_id, receipt_url } = req.body;

  // Validation
  if (!items || !items.length) return res.status(400).json({ message: 'No items in order' });
  if (!customer_email || !customer_phone) return res.status(400).json({ message: 'Contact info required' });

  let userId = req.user ? req.user.id : null;
  let generatedPassword = null;
  let userToken = null;
  let userData = null;

  // Handle User Creation for Guest Checkout
  if (!userId && customer_email) {
    try {
      // Check if user exists
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [customer_email]);

      if (userRes.rows.length > 0) {
        // User exists, associate order with them
        userId = userRes.rows[0].id;
      } else {
        // Create new user
        generatedPassword = Math.random().toString(36).slice(-8);
        const passwordHash = crypto.createHash('sha256').update(generatedPassword).digest('hex');
        const newUserId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        let username = customer_email.split('@')[0];
        // Ensure username uniqueness
        const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
          username = `${username}_${Math.random().toString(36).slice(2, 5)}`;
        }

        const newUser = await pool.query(
          `INSERT INTO users (id, username, password, email, role, created_at)
           VALUES ($1, $2, $3, $4, 'user', $5)
           RETURNING id, username, email, role, created_at`,
          [newUserId, username, passwordHash, customer_email, Date.now()]
        );

        userId = newUserId;
        const userObj = newUser.rows[0];

        // Generate Token
        userToken = jwt.sign({ id: userObj.id, email: userObj.email, role: userObj.role }, JWT_SECRET, { expiresIn: '30d' });
        userData = { ...userObj, name: userObj.username };
      }
    } catch (err) {
      console.error('Error handling user creation:', err);
    }
  }

  const orderId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newOrder = {
    id: orderId,
    user_id: userId,
    customer_name,
    customer_email,
    customer_phone,
    items,
    total_amount,
    currency: 'EGP',
    status: 'pending_approval', // Changed from 'pending' to 'pending_approval' per requirements
    payment_method: payment_method || 'cod',
    notes,
    player_id,
    receipt_url,
    payment_details: req.body.payment_details ? JSON.stringify(req.body.payment_details) : null,
    delivery_method: req.body.deliver_via || req.body.delivery_method || 'whatsapp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Try DB
    await pool.query(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, items, total_amount, currency, status, payment_method, notes, player_id, receipt_url, payment_details, delivery_method, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [newOrder.id, newOrder.user_id, newOrder.customer_name, newOrder.customer_email, newOrder.customer_phone, JSON.stringify(newOrder.items), newOrder.total_amount, newOrder.currency, newOrder.status, newOrder.payment_method, newOrder.notes, newOrder.player_id, newOrder.receipt_url, newOrder.payment_details, newOrder.delivery_method, newOrder.created_at, newOrder.updated_at]
    );
  } catch (dbError) {
    console.error('DB Insert failed, using JSON fallback:', dbError.message);
    const orders = readOrders();
    orders.push(newOrder);
    writeOrders(orders);
  }

  // Send notifications (customer + admin/connected numbers)
  try {
    const itemsList = items.map(i => `- ${i.title || i.name || i.id} (x${i.quantity})`).join('\n');
    const waText = `*New Order #${orderId}*\nTotal: ${total_amount} EGP\nCustomer: ${customer_name} (${customer_phone})\nEmail: ${customer_email || 'N/A'}\nItems:\n${itemsList}\n\nStatus: Pending Approval`;

    // Notify customer (client can pass `deliver_via` = 'whatsapp' to force WhatsApp delivery)
    const deliverVia = req.body.deliver_via || 'email';
    let customerMsg = `Thank you for your order #${orderId}! We are processing it. Status: Pending Approval.`;
    if (generatedPassword) {
      customerMsg += `\n\nAn account has been created for you.\nUsername: ${userData.name}\nPassword: ${generatedPassword}\nYou can change this in your account settings.`;
    }

    if (deliverVia === 'whatsapp') {
      try { await sendWhatsAppMessage(customer_phone, customerMsg); } catch (e) { console.error('Customer WhatsApp failed:', e?.message || e); }
    } else {
      if (newOrder.customer_email) {
        // Append password to email logic if possible, or send separate email
        const emailData = { ...newOrder, generatedPassword };
        try { await sendEmail(newOrder.customer_email, 'orderConfirmation', emailData); } catch (e) { console.error('Customer email failed:', e?.message || e); }
      }
    }

    // Notify admin
    const adminPhones = (process.env.ADMIN_PHONE || '').split(',').map(p => p.trim()).filter(Boolean);
    const connectedPhone = (process.env.CONNECTED_PHONE || '').trim();

    // Send to all admin phones
    for (const adminPhone of adminPhones) {
      try { await sendWhatsAppMessage(adminPhone, waText); } catch (e) { console.error(`Admin WhatsApp failed for ${adminPhone}:`, e?.message || e); }
    }

    if (connectedPhone && !adminPhones.includes(connectedPhone)) {
      try { await sendWhatsAppMessage(connectedPhone, waText); } catch (e) { console.error('Connected WhatsApp failed:', e?.message || e); }
    }
  } catch (e) {
    console.error('Notification error:', e);
  }

  res.json({
    id: orderId,
    status: newOrder.status,
    token: userToken,
    user: userData,
    generatedPassword
  });
});

// Get Orders (Admin)
router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('DB fetch failed, using JSON fallback');
    const orders = readOrders();
    res.json(orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// Update Status
router.put('/:id/status', authenticateToken, ensureAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  let order = null;

  try {
    // Try DB Update
    const result = await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    if (result.rows.length > 0) {
      order = result.rows[0];
    }
  } catch (dbError) {
    console.error('DB Update failed, using JSON fallback');
  }

  // JSON Update (always do this to keep sync if possible, or as primary if DB failed)
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status;
    orders[idx].updated_at = new Date().toISOString();
    writeOrders(orders);
    if (!order) order = orders[idx];
  }

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Notify user via WhatsApp
  try {
    if (order.customer_phone) {
      await sendWhatsAppMessage(order.customer_phone, `Your order #${id} status has been updated to: *${status}*`);
    }
  } catch (err) {
    console.error('WhatsApp notification failed:', err);
  }

  // Notify user via Email
  if (order.customer_email) {
    await sendEmail(order.customer_email, 'orderStatusUpdate', order);
  }

  // Audit log
  await logAudit('update_order_status', `Updated order ${id} status to ${status}`, req.user);

  res.json({ ok: true, order });
});

// Respond to Order (Admin)
router.post('/:id/respond', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, message } = req.body; // status: 'confirmed' | 'rejected'

  if (!['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be confirmed or rejected.' });
  }

  let order = null;
  try {
    // Update DB
    const newStatus = status === 'confirmed' ? 'confirmed' : 'rejected'; // Map to DB status enum if needed
    const result = await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [newStatus, id]);
    if (result.rows.length > 0) {
      order = result.rows[0];
    }
  } catch (dbError) {
    console.error('DB Update failed, using JSON fallback');
  }

  // JSON Update
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status === 'confirmed' ? 'confirmed' : 'rejected';
    orders[idx].updated_at = new Date().toISOString();
    writeOrders(orders);
    if (!order) order = orders[idx];
  }

  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Send Message
  if (message) {
    // WhatsApp
    if (order.customer_phone) {
      try {
        await sendWhatsAppMessage(order.customer_phone, message);
      } catch (e) {
        console.error('Failed to send WhatsApp response:', e.message);
      }
    }
    // Email
    if (order.customer_email) {
      try {
        await sendRawEmail(order.customer_email, `Update on Order #${id}`, message);
      } catch (e) {
        console.error('Failed to send Email response:', e.message);
      }
    }
  }

  await logAudit('respond_to_order', `Responded to order ${id} with status ${status}`, req.user);

  res.json({ ok: true, order });
});

// Get User's Orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('DB fetch failed, using JSON fallback');
    const orders = readOrders();
    const userOrders = orders.filter(o => o.user_id === userId);
    res.json(userOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// Track Order (Public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }
  } catch (err) {
    // Fallback
  }

  const orders = readOrders();
  const order = orders.find(o => o.id === id);
  if (order) return res.json(order);

  res.status(404).json({ message: 'Order not found' });
});

export default router;
