import express from 'express';
import pool from '../db.js';
import { authenticateToken, optionalAuthenticateToken, ensureAdmin } from '../middleware/auth.js';
import { sendWhatsAppMessage } from '../whatsapp.js';
import { logAudit } from '../utils/audit.js';
import { sendEmail, sendRawEmail } from '../utils/email.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getIO } from '../socket.js';
import dotenv from 'dotenv';

dotenv.config();

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
  } catch (err) { /* console.error('Error writing orders file:', err); */ }
};

// Create Order
router.post('/', optionalAuthenticateToken, async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_password, items, total_amount, payment_method, notes, player_id, receipt_url } = req.body;

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
        // Use provided password or generate a random one
        let passwordToHash = customer_password;
        if (!passwordToHash) {
          passwordToHash = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4).toUpperCase();
          generatedPassword = passwordToHash; // Only return generated password
        }

        // Use bcrypt for secure hashing
        const passwordHash = await import('bcryptjs').then(bcrypt => bcrypt.hash(passwordToHash, 10));

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

        // Log audit event
        logAudit('guest_user_created', `Guest user created during order: ${customer_email}`, { id: userId, email: customer_email });
      }
    } catch (err) {
      // console.error('Error handling user creation:', err);
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

  // Notify clients via Socket
  const io = getIO();
  if (io) {
    io.emit('orders_updated');
    io.emit('admin_notification', { type: 'new_order', message: `New Order #${orderId} from ${customer_name}` });
  }

  // Send notifications (customer + admin/connected numbers)
  try {
    const itemsList = items.map(i => {
      const name = i.title || i.name || i.id || 'Unknown Item';
      const qty = i.quantity || 1;
      const price = i.price != null ? ` - ${Number(i.price).toLocaleString('en-EG')} EGP` : '';
      const pkg = i.package || i.packageName || '';
      return `  • ${name}${pkg ? ` (${pkg})` : ''} x${qty}${price}`;
    }).join('\n');

    const orderDate = new Date().toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' });

    const waText = [
      `🛒 *طلب جديد | New Order*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📋 *Order ID:* ${orderId}`,
      `📅 *Date:* ${orderDate}`,
      ``,
      `👤 *Customer Details:*`,
      `  • Name: ${customer_name || 'N/A'}`,
      `  • Phone: ${customer_phone || 'N/A'}`,
      `  • Email: ${customer_email || 'N/A'}`,
      ...(player_id ? [`  • Player ID: ${player_id}`] : []),
      ``,
      `🎮 *Items Ordered:*`,
      itemsList,
      ``,
      `💳 *Payment:*`,
      `  • Method: ${payment_method || 'N/A'}`,
      `  • Total: *${Number(total_amount).toLocaleString('en-EG')} EGP*`,
      ...(notes ? [``, `📝 *Notes:* ${notes}`] : []),
      ...(receipt_url ? [``, `🧾 *Receipt:* ${receipt_url}`] : []),
      ``,
      `⏳ *Status:* Pending Approval`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');

    // Notify customer (client can pass `deliver_via` = 'whatsapp' to force WhatsApp delivery)
    const deliverVia = req.body.deliver_via || 'email';
    const customerWaMsg = [
      `✅ *تم استلام طلبك! | Order Received*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `شكراً لثقتك في متجر ضياء 🎮`,
      `Thank you for your order at Diaa Gaming Store!`,
      ``,
      `📋 *Order ID:* ${orderId}`,
      `💰 *Total:* ${Number(total_amount).toLocaleString('en-EG')} EGP`,
      `⏳ *Status:* Pending Approval`,
      ``,
      `سيتم تنفيذ طلبك في أقرب وقت ممكن ✨`,
      `Your order will be processed as soon as possible.`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');

    let customerMsg = customerWaMsg;
    if (generatedPassword) {
      customerMsg += `\n\n🔑 *Account Created:*\nUsername: ${userData.name}\nPassword: ${generatedPassword}\nPlease change your password after logging in.`;
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
    generatedPassword,
    loginFailed: !!generatedPassword && !userToken
  });
});

// Get Orders (Admin)
router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  let orders = [];
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    orders = result.rows;
  } catch (err) {
    console.error('DB fetch failed, using JSON fallback');
  }

  // Always merge JSON fallback to ensure no data loss (e.g. if insert failed but JSON succeeded)
  try {
    const jsonOrders = readOrders();
    const dbIds = new Set(orders.map(o => o.id));
    const newJsonOrders = jsonOrders.filter(o => !dbIds.has(o.id));

    if (newJsonOrders.length > 0) {
      orders = [...orders, ...newJsonOrders];
      // Re-sort
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (e) {
    console.error('Error reading orders.json:', e);
  }

  res.json(orders);
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

  // Notify clients
  const io = getIO();
  if (io) {
    io.emit('orders_updated');
    io.emit('order_status_changed', { orderId: id, status, customerEmail: order.customer_email });
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
  const { status, message, delivery_message } = req.body; // status: 'confirmed' | 'rejected' | 'completed'

  if (!['confirmed', 'rejected', 'completed', 'delivered'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  let order = null;
  const newStatus = status;
  try {
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
    orders[idx].status = newStatus;
    orders[idx].updated_at = new Date().toISOString();
    if (delivery_message) orders[idx].delivery_message = delivery_message;
    writeOrders(orders);
    if (!order) order = orders[idx];
  }

  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (delivery_message) order.delivery_message = delivery_message;

  // Notify clients
  const io = getIO();
  if (io) io.emit('orders_updated');

  // If completed/delivered, send delivery email with the code/message
  const isDelivery = ['completed', 'delivered'].includes(status);

  // Send delivery message via WhatsApp
  const msgToSend = delivery_message || message;
  if (msgToSend && order.customer_phone) {
    try {
      const waMsg = `*متجر ضياء 🎮*\n\nأهلاً ${order.customer_name || ''}،\n\n${isDelivery ? '✅ تم تنفيذ طلبك بنجاح!\n\n' : ''}${msgToSend}\n\nرقم الطلب: ${id}`;
      await sendWhatsAppMessage(order.customer_phone, waMsg);
    } catch (e) {
      console.error('Failed to send WhatsApp response:', e.message);
    }
  }

  // Send email
  if (order.customer_email) {
    try {
      if (isDelivery) {
        await sendEmail(order.customer_email, 'orderDelivery', { ...order, delivery_message: msgToSend });
      } else if (msgToSend) {
        await sendRawEmail(
          order.customer_email,
          `📩 تحديث على طلبك #${id} | Order Update`,
          msgToSend
        );
      } else {
        await sendEmail(order.customer_email, 'orderStatusUpdate', order);
      }
    } catch (e) {
      console.error('Failed to send Email response:', e.message);
    }
  }

  await logAudit('respond_to_order', `Responded to order ${id} with status ${status}`, req.user);

  res.json({ ok: true, order });
});

// Get User's Orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  let userOrders = [];

  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    userOrders = result.rows;
  } catch (err) {
    console.error('DB fetch failed, using JSON fallback');
  }

  // Merge JSON
  try {
    const jsonOrders = readOrders();
    const dbIds = new Set(userOrders.map(o => o.id));
    const myJsonOrders = jsonOrders.filter(o => o.user_id === userId && !dbIds.has(o.id));

    if (myJsonOrders.length > 0) {
      userOrders = [...userOrders, ...myJsonOrders];
      userOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (e) { }

  res.json(userOrders);
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
