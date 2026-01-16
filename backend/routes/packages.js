
import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get package by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Query game_packages table
    const result = await pool.query(`
      SELECT gp.*, g.name as game_name, g.image as game_image 
      FROM game_packages gp
      LEFT JOIN games g ON gp.game_id = g.id
      WHERE gp.slug = $1
    `, [slug]);
    
    if (result.rows.length > 0) {
      const pkg = result.rows[0];
      return res.json({
        id: pkg.id,
        gameId: pkg.game_id,
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        price: Number(pkg.price),
        discountPrice: pkg.discount_price ? Number(pkg.discount_price) : null,
        bonus: pkg.bonus,
        image: pkg.image,
        gameName: pkg.game_name,
        gameImage: pkg.game_image
      });
    }

    res.status(404).json({ message: 'Package not found' });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
