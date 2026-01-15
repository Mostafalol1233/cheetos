import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get active slides
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

export default router;
