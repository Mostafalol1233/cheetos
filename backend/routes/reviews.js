import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      game_slug VARCHAR(100) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      user_email VARCHAR(200),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      is_approved BOOLEAN DEFAULT true,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `);
};
initTable().catch(console.error);

router.get('/game/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE game_slug = $1 AND is_approved = true ORDER BY created_at DESC LIMIT 30',
      [slug]
    );
    const stats = await pool.query(
      `SELECT
        ROUND(AVG(rating)::NUMERIC, 1) as avg_rating,
        COUNT(*) as total,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews WHERE game_slug = $1 AND is_approved = true`,
      [slug]
    );
    res.json({ reviews: result.rows, stats: stats.rows[0] });
  } catch (err) {
    console.error('Reviews get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { game_slug, user_name, user_email, rating, comment } = req.body;
  if (!game_slug || !user_name || !rating) {
    return res.status(400).json({ message: 'Game, name, and rating are required' });
  }
  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO reviews (game_slug, user_name, user_email, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [game_slug, user_name, user_email || null, ratingNum, comment || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;
  try {
    const result = await pool.query(
      'UPDATE reviews SET is_approved = $1 WHERE id = $2 RETURNING *',
      [is_approved, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
