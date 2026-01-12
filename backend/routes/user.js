import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// JSON fallback for user data
const getUserDataFile = (userId) => path.join(__dirname, `../data/user_${userId}.json`);
const readUserData = (userId) => {
  try {
    const filePath = getUserDataFile(userId);
    if (!fs.existsSync(filePath)) return { orders: [], messages: [] };
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch { return { orders: [], messages: [] }; }
};
const writeUserData = (userId, data) => {
  try {
    const filePath = getUserDataFile(userId);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) { console.error('Error writing user data file:', err); }
};

// Middleware to get user from token
const getUserFromToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Get user orders
router.get('/orders', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let orders = [];

    // Try database first
    try {
      const result = await pool.query(`
        SELECT
          o.id,
          o.status,
          o.total,
          o.created_at,
          json_agg(
            json_build_object(
              'id', oi.id,
              'name', g.name,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN games g ON oi.game_id = g.id
        WHERE o.user_id = $1
        GROUP BY o.id, o.status, o.total, o.created_at
        ORDER BY o.created_at DESC
      `, [userId]);

      orders = result.rows.map(order => ({
        ...order,
        items: order.items || []
      }));
    } catch (dbError) {
      console.error('DB query failed, using JSON fallback:', dbError.message);
      // Fallback to JSON
      const userData = readUserData(userId);
      orders = userData.orders || [];
    }

    res.json({ orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get user profile
router.get('/profile', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let user = null;

    // Try database first
    try {
      const result = await pool.query(
        'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbError) {
      console.error('DB query failed, using JSON fallback:', dbError.message);
      // Fallback to JSON
      const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8') || '[]');
      user = users.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Get chat history
router.get('/chat/history', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let messages = [];

    // Try database first
    try {
      const result = await pool.query(
        'SELECT id, text, sender, created_at FROM messages WHERE user_id = $1 ORDER BY created_at ASC',
        [userId]
      );
      messages = result.rows.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.created_at
      }));
    } catch (dbError) {
      console.error('DB query failed, using JSON fallback:', dbError.message);
      // Fallback to JSON
      const userData = readUserData(userId);
      messages = userData.messages || [];
    }

    res.json({ messages });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Send chat message
router.post('/chat/send', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const newMessage = {
      id: messageId,
      text: message.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      user_id: userId
    };

    // Try database first
    try {
      await pool.query(
        'INSERT INTO messages (id, user_id, text, sender) VALUES ($1, $2, $3, $4)',
        [messageId, userId, message.trim(), 'user']
      );
    } catch (dbError) {
      console.error('DB insert failed, using JSON fallback:', dbError.message);
      // Fallback to JSON
      const userData = readUserData(userId);
      userData.messages = userData.messages || [];
      userData.messages.push({
        id: messageId,
        text: message.trim(),
        sender: 'user',
        timestamp: new Date().toISOString()
      });
      writeUserData(userId, userData);
    }

    // TODO: Notify admin/support about new message
    // This could be done via WebSocket, email, or other notification system

    res.json({
      message: 'Message sent successfully',
      messageId
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get all user messages (admin only)
router.get('/admin/messages', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    let allMessages = [];

    // Try database first
    try {
      const result = await pool.query(`
        SELECT
          m.id,
          m.text,
          m.sender,
          m.created_at,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          m.user_id
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
      `);

      allMessages = result.rows.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.created_at,
        userId: msg.user_id,
        userName: msg.user_name,
        userEmail: msg.user_email,
        userPhone: msg.user_phone
      }));
    } catch (dbError) {
      console.error('DB query failed, using JSON fallback:', dbError.message);
      // Fallback to JSON - need to read all user data files
      const dataDir = path.join(__dirname, '../data');
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir).filter(f => f.startsWith('user_') && f.endsWith('.json'));
        for (const file of files) {
          const userId = file.replace('user_', '').replace('.json', '');
          const userData = readUserData(userId);
          const userMessages = userData.messages || [];

          // Get user info
          let userInfo = {};
          try {
            const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8') || '[]');
            userInfo = users.find(u => u.id === userId) || {};
          } catch {}

          allMessages.push(...userMessages.map(msg => ({
            ...msg,
            userId,
            userName: userInfo.name || 'Unknown',
            userEmail: userInfo.email || '',
            userPhone: userInfo.phone || ''
          })));
        }
      }
    }

    res.json({ messages: allMessages });
  } catch (err) {
    console.error('Error fetching all messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send admin reply to user
router.post('/admin/reply/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const newMessage = {
      id: messageId,
      text: message.trim(),
      sender: 'admin',
      timestamp: new Date().toISOString(),
      user_id: userId
    };

    // Try database first
    try {
      await pool.query(
        'INSERT INTO messages (id, user_id, text, sender) VALUES ($1, $2, $3, $4)',
        [messageId, userId, message.trim(), 'admin']
      );
    } catch (dbError) {
      console.error('DB insert failed, using JSON fallback:', dbError.message);
      // Fallback to JSON
      const userData = readUserData(userId);
      userData.messages = userData.messages || [];
      userData.messages.push({
        id: messageId,
        text: message.trim(),
        sender: 'admin',
        timestamp: new Date().toISOString()
      });
      writeUserData(userId, userData);
    }

    res.json({
      message: 'Reply sent successfully',
      messageId
    });
  } catch (err) {
    console.error('Error sending reply:', err);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

export default router;