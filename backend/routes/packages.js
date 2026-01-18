
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

// PUT /api/packages/:id - Update package (admin only)
router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, discountPrice, bonus, image, slug } = req.body;

  try {
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(Number(price));
    }
    if (discountPrice !== undefined) {
      updates.push(`discount_price = $${paramIndex++}`);
      values.push(discountPrice ? Number(discountPrice) : null);
    }
    if (bonus !== undefined) {
      updates.push(`bonus = $${paramIndex++}`);
      values.push(bonus);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      values.push(image);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE game_packages SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const pkg = result.rows[0];
    res.json({
      id: pkg.id,
      gameId: pkg.game_id,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      price: Number(pkg.price),
      discountPrice: pkg.discount_price ? Number(pkg.discount_price) : null,
      bonus: pkg.bonus,
      image: pkg.image
    });
  } catch (error) {
    console.error('Package update failed:', error.message);
    res.status(500).json({ message: 'Failed to update package', error: error.message });
  }
});

// DELETE /api/packages/:id - Delete package (admin only)
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM game_packages WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ ok: true, deletedId: id });
  } catch (error) {
    console.error('Package delete failed:', error.message);
    res.status(500).json({ message: 'Failed to delete package', error: error.message });
  }
});

export default router;
