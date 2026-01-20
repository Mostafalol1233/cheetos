import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get users list with pagination and search
router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const q = req.query.q ? String(req.query.q).trim() : '';
    const offset = (page - 1) * limit;

    let queryText = 'SELECT id, name, email, email_verified, phone, role, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    let params = [];

    if (q) {
      queryText += ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1';
      countQuery += ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1';
      params.push(`%${q}%`);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(queryText, [...params, limit, offset]);

    res.json({
      items: result.rows,
      total,
      page,
      limit
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Export users
router.get('/export', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';

    let queryText = 'SELECT id, name, email, phone, role, created_at FROM users';
    let params = [];

    if (q) {
      queryText += ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1';
      params.push(`%${q}%`);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await pool.query(queryText, params);

    // Generate CSV
    const fields = ['id', 'username', 'email', 'phone', 'role', 'created_at'];
    const csv = [
      fields.join(','),
      ...result.rows.map(row => fields.map(field => JSON.stringify(row[field] || '')).join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting users:', err);
    res.status(500).json({ message: 'Failed to export users' });
  }
});

export default router;
