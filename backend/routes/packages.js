
import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import localDb from '../utils/localDb.js';

const router = express.Router();

// Get package by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
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

    throw new Error('Package not found in DB');
  } catch (error) {
    // Fallback to localDb
    console.warn('DB Package fetch failed, trying localDb:', error.message);
    const games = localDb.getGames();
    
    for (const game of games) {
        const packages = game.packagesList || [];
        const pkg = packages.find(p => p.slug === slug || (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug));
        
        if (pkg) {
            return res.json({
                id: pkg.id,
                gameId: game.id,
                name: pkg.name,
                slug: pkg.slug || slug,
                description: pkg.description,
                price: Number(pkg.price),
                discountPrice: pkg.discountPrice ? Number(pkg.discountPrice) : null,
                bonus: pkg.bonus,
                image: pkg.image,
                gameName: game.name,
                gameImage: game.image
            });
        }
    }

    res.status(404).json({ message: 'Package not found' });
  }
});

export default router;
