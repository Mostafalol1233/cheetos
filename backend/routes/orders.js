import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { sendWhatsAppMessage } from '../whatsapp.js';
import { logAudit } from '../utils/audit.js';
import { sendEmail } from '../utils/email.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
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
  const { customer_name, customer_email, customer_phone, items, total_amount, payment_method } = req.body;
  
  // Validation
  if (!items || !items.length) return res.status(400).json({ message: 'No items in order' });
  if (!customer_email || !customer_phone) return res.status(400).json({ message: 'Contact info required' });

  const orderId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newOrder = {
    id: orderId,
    user_id: req.user ? req.user.id : null,
    customer_name,
    customer_email,
    customer_phone,
    items,
    total_amount,
    currency: 'EGP',
    status: 'pending',
    payment_method: payment_method || 'cod',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Try DB
    await pool.query(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, items, total_amount, currency, status, payment_method, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [newOrder.id, newOrder.user_id, newOrder.customer_name, newOrder.customer_email, newOrder.customer_phone, JSON.stringify(newOrder.items), newOrder.total_amount, newOrder.currency, newOrder.status, newOrder.payment_method, newOrder.created_at, newOrder.updated_at]
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
    const waText = `*New Order #${orderId}*\nTotal: ${total_amount} EGP\nCustomer: ${customer_name} (${customer_phone})\nEmail: ${customer_email || 'N/A'}\nItems:\n${itemsList}\n\nStatus: Pending`;

    // Notify customer (client can pass `deliver_via` = 'whatsapp' to force WhatsApp delivery)
    const deliverVia = req.body.deliver_via || 'email';
    const customerMsg = `Thank you for your order #${orderId}! We are processing it.`;

    if (deliverVia === 'whatsapp') {
      try { await sendWhatsAppMessage(customer_phone, customerMsg); } catch (e) { console.error('Customer WhatsApp failed:', e?.message || e); }
    } else {
      if (newOrder.customer_email) {
        try { await sendEmail(newOrder.customer_email, 'orderConfirmation', newOrder); } catch (e) { console.error('Customer email failed:', e?.message || e); }
      }
    }

    // Notify admin and connected numbers with full details
    const adminPhone = (process.env.ADMIN_PHONE || '').trim();
    const connectedPhone = (process.env.CONNECTED_PHONE || '').trim();
    if (adminPhone) {
      try { await sendWhatsAppMessage(adminPhone, waText); } catch (e) { console.error('Admin WhatsApp failed:', e?.message || e); }
    }
    if (connectedPhone && connectedPhone !== adminPhone) {
      try { await sendWhatsAppMessage(connectedPhone, waText); } catch (e) { console.error('Connected WhatsApp failed:', e?.message || e); }
    }
  } catch (waErr) {
    console.error('Failed to send notifications:', waErr.message || waErr);
  }

  res.status(201).json(newOrder);
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
