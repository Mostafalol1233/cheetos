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
  } catch (err) { /* console.error('Error writing user data file:', err); */ }
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
      // console.error('DB query failed, using JSON fallback:', dbError.message);
      // Fallback to JSON
      const userData = readUserData(userId);
      orders = userData.orders || [];
    }

    res.json({ orders });
  } catch (err) {
    // console.error('Error fetching orders:', err);
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
        'SELECT id, name, email, phone, role, created_at, avatar_url FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbError) {
      console.error('DB query failed, using JSON fallback:', dbError.message);
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

// Upload avatar (accepts base64 image)
router.post('/avatar', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatarBase64 } = req.body;

    if (!avatarBase64) {
      return res.status(400).json({ message: 'Avatar data required' });
    }

    const matches = avatarBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: 'Invalid image data' });
    }

    const ext = matches[1].split('/')[1] === 'jpeg' ? 'jpg' : matches[1].split('/')[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image must be under 2MB' });
    }

    const avatarsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

    const filename = `avatar_${userId}.${ext}`;
    const filepath = path.join(avatarsDir, filename);
    fs.writeFileSync(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);

    res.json({ avatarUrl, message: 'Avatar updated successfully' });
  } catch (err) {
    console.error('Error uploading avatar:', err);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// Update user profile
router.put('/profile', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, email, phone, role, created_at',
      [name.trim(), phone ? phone.trim() : null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0], message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { createHash } = await import('crypto');
    const currentHash = createHash('sha256').update(currentPassword).digest('hex');
    
    let bcrypt;
    try { bcrypt = await import('bcrypt'); } catch {}
    
    const storedHash = userResult.rows[0].password_hash;
    let isValid = false;
    
    if (bcrypt && storedHash && storedHash.startsWith('$2')) {
      isValid = await bcrypt.default.compare(currentPassword, storedHash);
    } else {
      isValid = storedHash === currentHash;
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    let newHash;
    if (bcrypt) {
      newHash = await bcrypt.default.hash(newPassword, 10);
    } else {
      newHash = createHash('sha256').update(newPassword).digest('hex');
    }

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Failed to change password' });
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
        'SELECT id, message_encrypted as text, sender, timestamp FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC',
        [userId]
      );
      messages = result.rows.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp
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

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
        'INSERT INTO chat_messages (id, session_id, message_encrypted, sender, read) VALUES ($1, $2, $3, $4, $5)',
        [messageId, userId, message.trim(), 'user', false]
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

    // Notify admin via socket
    try {
      const io = getIO();
      if (io) {
        const payload = {
          id: messageId,
          sessionId: userId,
          sender: 'user',
          text: message.trim(),
          timestamp: new Date().toISOString(),
          read: false
        };
        io.to('admin_room').emit('chat_message', payload);
        // Also ensure session list updates
        io.emit('admin_chat_update', { sessionId: userId, lastMessage: payload });
      }
    } catch (e) { }

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
          } catch { }

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

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

    try {
      const io = getIO();
      if (io) {
        const msgPayload = {
          id: messageId,
          sessionId: userId,
          sender: 'admin',
          message: message.trim(),
          timestamp: Date.now(),
          read: false
        };
        // Emit to user's room
        io.to(userId).emit('new_message', msgPayload);
        // Emit to admin room (for other admins)
        io.to('admin_room').emit('new_message', msgPayload);
        io.to('admin_room').emit('session_updated', {
          sessionId: userId,
          lastMessage: msgPayload,
          unreadCount: 0
        });
      }
    } catch (e) {
      console.error('Socket emit error:', e);
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