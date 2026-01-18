import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get active slides (public)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id,
        background_image_url as "backgroundImageUrl",
        title_ar as "titleAr",
        title_en as "titleEn",
        promo_text_ar as "promoTextAr",
        promo_text_en as "promoTextEn",
        button_text as "buttonText",
        button_link as "buttonLink",
        display_order as "displayOrder",
        is_active as "isActive"
      FROM hero_slides
      WHERE is_active = true
      ORDER BY display_order ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching hero slides:', err.message);
    // If table doesn't exist, return empty array instead of crashing
    if (err.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ message: "Failed to load slides" });
  }
});

// Get all slides (admin - includes inactive)
router.get('/all', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id,
        background_image_url as "backgroundImageUrl",
        title_ar as "titleAr",
        title_en as "titleEn",
        promo_text_ar as "promoTextAr",
        promo_text_en as "promoTextEn",
        button_text as "buttonText",
        button_link as "buttonLink",
        display_order as "displayOrder",
        is_active as "isActive"
      FROM hero_slides
      ORDER BY display_order ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all hero slides:', err.message);
    if (err.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ message: "Failed to load slides" });
  }
});

// Create slide (admin)
router.post('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const {
      backgroundImageUrl, titleAr, titleEn, promoTextAr, promoTextEn,
      buttonText, buttonLink, displayOrder, isActive
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO hero_slides (
        background_image_url, title_ar, title_en, promo_text_ar, promo_text_en,
        button_text, button_link, display_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      backgroundImageUrl || '', titleAr || '', titleEn || '',
      promoTextAr || '', promoTextEn || '',
      buttonText || '', buttonLink || '', displayOrder || 0, isActive !== false
    ]);

    res.status(201).json({ id: rows[0].id, message: 'Slide created' });
  } catch (err) {
    console.error('Error creating hero slide:', err.message);
    res.status(500).json({ message: "Failed to create slide" });
  }
});

// Update slide (admin)
router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      backgroundImageUrl, titleAr, titleEn, promoTextAr, promoTextEn,
      buttonText, buttonLink, displayOrder, isActive
    } = req.body;

    const result = await pool.query(`
      UPDATE hero_slides SET
        background_image_url = COALESCE($1, background_image_url),
        title_ar = COALESCE($2, title_ar),
        title_en = COALESCE($3, title_en),
        promo_text_ar = COALESCE($4, promo_text_ar),
        promo_text_en = COALESCE($5, promo_text_en),
        button_text = COALESCE($6, button_text),
        button_link = COALESCE($7, button_link),
        display_order = COALESCE($8, display_order),
        is_active = COALESCE($9, is_active)
      WHERE id = $10
      RETURNING id
    `, [
      backgroundImageUrl, titleAr, titleEn, promoTextAr, promoTextEn,
      buttonText, buttonLink, displayOrder, isActive, id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    res.json({ id, message: 'Slide updated' });
  } catch (err) {
    console.error('Error updating hero slide:', err.message);
    res.status(500).json({ message: "Failed to update slide" });
  }
});

// Delete slide (admin)
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM hero_slides WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    res.json({ message: 'Slide deleted' });
  } catch (err) {
    console.error('Error deleting hero slide:', err.message);
    res.status(500).json({ message: "Failed to delete slide" });
  }
});

export default router;

