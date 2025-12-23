import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

export function verifyAdmin(req, res, next) {
  const role = req.user?.role;
  if (role === 'admin') return next();
  return res.status(403).json({ message: 'Forbidden' });
}

export async function verifyOrderOwnership(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (role === 'admin') return next();
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const r = await pool.query('SELECT user_id FROM transactions WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    if (String(r.rows[0].user_id) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

