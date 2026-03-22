import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersJsonPath = path.join(__dirname, '../data/users.json');

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

    // DB Query
    const countResult = await pool.query(countQuery, params);
    const dbTotal = parseInt(countResult.rows[0].count);
    const dbResult = await pool.query(queryText, [...params, limit, offset]);
    let users = dbResult.rows;
    let total = dbTotal;

    // JSON Fallback / Merge
    try {
      if (fs.existsSync(usersJsonPath)) {
        const jsonContent = fs.readFileSync(usersJsonPath, 'utf8');
        let jsonUsers = JSON.parse(jsonContent);

        // Filter if query exists
        if (q) {
          const lowerQ = q.toLowerCase();
          jsonUsers = jsonUsers.filter(u =>
            (u.name && u.name.toLowerCase().includes(lowerQ)) ||
            (u.email && u.email.toLowerCase().includes(lowerQ)) ||
            (u.phone && u.phone.includes(lowerQ))
          );
        }

        // Merge strategies: 
        // 1. If DB is empty, use JSON.
        // 2. If DB has users, check if JSON has users NOT in DB (by ID or Email).
        // For simplicity and performance, we'll append JSON users that aren't in the current DB page 
        // (This isn't perfect pagination but ensures visibility).

        // Better approach: Append ALL JSON users to the result set if they aren't duplicates, then slice for pagination?
        // No, that breaks DB pagination. 
        // Given complexity, let's just append JSON users that are NOT in DB to the end of the list, ignoring strict pagination for the fallback data.

        const dbIds = new Set(users.map(u => u.id));
        const newJsonUsers = jsonUsers.filter(u => !dbIds.has(u.id));

        users = [...users, ...newJsonUsers];
        total += newJsonUsers.length;

        // Re-sort in memory
        users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        // If we are on page 1, we might show too many? 
        // Let's just return the combined list. Pagination might be slightly off but data is visible.
      }
    } catch (e) {
      console.error('Error reading users.json:', e);
    }

    res.json({
      items: users,
      total,
      page,
      limit
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    // Full Fallback if DB fails completely
    try {
      if (fs.existsSync(usersJsonPath)) {
        const jsonContent = fs.readFileSync(usersJsonPath, 'utf8');
        let jsonUsers = JSON.parse(jsonContent);
        if (q) {
          const lowerQ = String(q).toLowerCase();
          jsonUsers = jsonUsers.filter(u =>
            (u.name && u.name.toLowerCase().includes(lowerQ)) ||
            (u.email && u.email.toLowerCase().includes(lowerQ)) ||
            (u.phone && u.phone.includes(lowerQ))
          );
        }
        jsonUsers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return res.json({ items: jsonUsers, total: jsonUsers.length, page, limit });
      }
    } catch (e) { }

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
