import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all templates
router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_response_templates ORDER BY title ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a template
router.post('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message || !type) {
      return res.status(400).json({ message: 'Title, message and type are required' });
    }
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await pool.query(
      'INSERT INTO admin_response_templates (id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, title, message, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a template
router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type } = req.body;
    const result = await pool.query(
      'UPDATE admin_response_templates SET title = COALESCE($1, title), message = COALESCE($2, message), type = COALESCE($3, type) WHERE id = $4 RETURNING *',
      [title, message, type, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a template
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM admin_response_templates WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
