import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@diaaldeen.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const qrSessions = new Map();

// JSON fallback for users
const getUsersFile = () => path.join(__dirname, '../data/users.json');
const readUsers = () => {
  try {
    const filePath = getUsersFile();
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch { return []; }
};
const writeUsers = (users) => {
  try {
    const filePath = getUsersFile();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  } catch (err) { console.error('Error writing users file:', err); }
};

// ===================== ADMIN AUTH =====================

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      const csrfToken = crypto.randomBytes(16).toString('hex');
      const sameSite = process.env.NODE_ENV === 'production' ? 'None' : 'Lax';
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.setHeader('Set-Cookie', `csrf_token=${encodeURIComponent(csrfToken)}; Path=/; SameSite=${sameSite}${secure}`);
      return res.json({ token, email, role: 'admin', csrfToken });
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/verify', authenticateToken, async (req, res) => {
  try {
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User Verify
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({ ok: true, user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== USER AUTH =====================

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    // Simple hash (in production use bcrypt)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const newUser = {
      id: userId,
      name,
      email,
      password_hash: passwordHash,
      phone: phone || '',
      role: 'user',
      created_at: new Date().toISOString()
    };

    // Try DB
    try {
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, name, email, passwordHash, phone, 'user']
      );
    } catch (dbError) {
      console.error('DB Insert failed, using JSON fallback:', dbError.message);
      // Check duplicate email in JSON
      const users = readUsers();
      if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      users.push(newUser);
      writeUsers(users);
    }

    const token = jwt.sign({ id: userId, name, email, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: userId, name, email, role: 'user' } });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Login (User)
router.post('/login', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Legacy/Chat login (Name + Phone)
    if (!password && name && phone) {
        // Create or get user
        let userId;
        let user;
        
        try {
            const userResult = await pool.query('SELECT id, name, phone, email, role FROM users WHERE phone = $1', [phone]);
            if (userResult.rows.length === 0) {
                userId = `user_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
                user = { id: userId, name, phone, email: email || '', role: 'user' };
                await pool.query('INSERT INTO users (id, name, phone, email) VALUES ($1, $2, $3, $4)', [userId, name, phone, email || null]);
            } else {
                user = userResult.rows[0];
                userId = user.id;
                // Update name if provided
                if (name !== user.name) {
                    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
                    user.name = name;
                }
            }
        } catch (dbError) {
             // Fallback to JSON
             const users = readUsers();
             user = users.find(u => u.phone === phone);
             if (!user) {
                 userId = `user_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
                 user = { id: userId, name, phone, email: email || '', role: 'user' };
                 users.push(user);
                 writeUsers(users);
             } else {
                 userId = user.id;
                 if (name !== user.name) {
                     user.name = name;
                     writeUsers(users);
                 }
             }
        }

        const sessionToken = jwt.sign({ id: userId, name: user.name, phone: user.phone, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
        return res.json({ token: sessionToken, user, message: 'Login successful' });
    }

    // Standard Login (Email + Password)
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    let user;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        user = result.rows[0];
    } catch (dbError) {
        const users = readUsers();
        user = users.find(u => u.email === email);
    }

    if (!user || user.password_hash !== passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== QR AUTH =====================

router.post('/qr/start', async (req, res) => {
  try {
    const id = `qr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const token = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    qrSessions.set(id, { token, status: 'pending', createdAt: now, expiresAt });
    res.json({ id, token, expiresAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/qr/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const s = qrSessions.get(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (Date.now() > s.expiresAt && s.status !== 'approved') {
      s.status = 'expired';
    }
    res.json({ status: s.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/qr/confirm', async (req, res) => {
  try {
    const { id, token } = req.body || {};
    const s = qrSessions.get(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (s.status === 'expired') return res.status(400).json({ message: 'Expired' });
    if (Date.now() > s.expiresAt) {
      s.status = 'expired';
      return res.status(400).json({ message: 'Expired' });
    }
    if (s.token !== token) return res.status(403).json({ message: 'Invalid' });
    s.status = 'approved';
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/qr/consume', async (req, res) => {
  try {
    const { id } = req.body || {};
    const s = qrSessions.get(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (s.status !== 'approved') return res.status(400).json({ message: 'Not approved' });
    const email = ADMIN_EMAIL;
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    qrSessions.delete(id);
    res.json({ token, user: { email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
