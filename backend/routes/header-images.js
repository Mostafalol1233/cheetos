import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import pool from '../db.js';
import { getIO } from '../socket.js';

const router = express.Router();

// Public endpoint - Get active header version for hero carousel (no auth required)
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM header_versions WHERE is_active = true AND archived = false LIMIT 1'
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // Return default header data if none active
      res.json({
        id: 'default',
        image_url: 'https://files.catbox.moe/ciy961.webp',
        heading_text: 'Level Up Your Game',
        button_text: 'Explore Now',
        button_url: '/games'
      });
    }
  } catch (err) {
    // Return default on error
    res.json({
      id: 'default',
      image_url: 'https://files.catbox.moe/ciy961.webp',
      heading_text: 'Level Up Your Game',
      button_text: 'Explore Now',
      button_url: '/games'
    });
  }
});


// Configure multer for header image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'headers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'header-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .webp format allowed!'));
  }
});

// Upload header image
router.post('/upload', authenticateToken, ensureAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `/uploads/headers/${req.file.filename}`;
  res.json({ imageUrl });
});

// Save header version (Comprehensive)
router.post('/save-version', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { imageUrl, headingText, buttonText, buttonUrl, isActive } = req.body;

    // Validate required fields if necessary, or provide defaults
    // User requirement: "Default to '/games' when left empty" -> handled in frontend or here
    const finalButtonUrl = buttonUrl || '/games';
    const finalHeadingText = headingText || 'Level up your game';
    const finalButtonText = buttonText || 'Shop Now';

    // Save to header_versions
    const result = await pool.query(
      `INSERT INTO header_versions 
       (image_url, heading_text, button_text, button_url, is_active, archived) 
       VALUES ($1, $2, $3, $4, $5, false) 
       RETURNING *`,
      [imageUrl, finalHeadingText, finalButtonText, finalButtonUrl, isActive || false]
    );

    const version = result.rows[0];

    // If active, update site_settings and other versions
    if (isActive) {
      await pool.query('UPDATE header_versions SET is_active = false WHERE id != $1', [version.id]);

      // Update site_settings
      // Use the existing settings ID or 'default' if strictly enforced, but better to target the single row
      await pool.query(`
        UPDATE settings 
        SET header_image_url = $1,
            header_heading_text = $2,
            header_button_text = $3,
            header_button_url = $4,
            updated_at = NOW()
        WHERE id = (SELECT id FROM settings LIMIT 1)
      `, [imageUrl, finalHeadingText, finalButtonText, finalButtonUrl]);
    }

    res.json(version);
  } catch (err) {
    console.error('Error saving header version:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get versions history
router.get('/versions', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM header_versions WHERE archived = false ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete/Archive version
router.delete('/versions/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE header_versions SET archived = true WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Restore/Activate version
router.post('/versions/:id/activate', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the version details
    const vRes = await pool.query('SELECT * FROM header_versions WHERE id = $1', [id]);
    if (vRes.rows.length === 0) return res.status(404).json({ message: 'Version not found' });
    const version = vRes.rows[0];

    // Deactivate others
    await pool.query('UPDATE header_versions SET is_active = false');

    // Activate this one
    await pool.query('UPDATE header_versions SET is_active = true WHERE id = $1', [id]);

    // Update settings
    await pool.query(`
        UPDATE settings 
        SET header_image_url = $1,
            header_heading_text = $2,
            header_button_text = $3,
            header_button_url = $4,
            updated_at = NOW()
        WHERE id = (SELECT id FROM settings LIMIT 1)
      `, [version.image_url, version.heading_text, version.button_text, version.button_url]);

    const io = getIO();
    if (io) {
      io.emit('header_updated', { type: 'activate', version });
    }

    res.json({ ok: true, version });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get archived versions (for recovery)
router.get('/versions/archived', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM header_versions WHERE archived = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Recover archived version
router.post('/versions/:id/recover', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE header_versions SET archived = false WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy support for existing frontend calling /save
router.post('/save', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { imageUrl, cropData } = req.body;
    // Just forward to save-version with defaults
    // We assume this is just image update

    const headingText = 'Level up your game'; // Default
    const buttonText = 'Shop Now';
    const buttonUrl = '/games';

    const result = await pool.query(
      `INSERT INTO header_versions 
       (image_url, heading_text, button_text, button_url, is_active, archived) 
       VALUES ($1, $2, $3, $4, true, false) 
       RETURNING *`,
      [imageUrl, headingText, buttonText, buttonUrl]
    );

    // Update settings
    await pool.query(`
        UPDATE settings 
        SET header_image_url = $1,
            header_heading_text = $2,
            header_button_text = $3,
            header_button_url = $4,
            updated_at = NOW()
        WHERE id = (SELECT id FROM settings LIMIT 1)
      `, [imageUrl, headingText, buttonText, buttonUrl]);

    // Also insert into legacy header_image_edits if needed for older code
    const legacyId = `edit_${Date.now()}`;
    await pool.query(
      'INSERT INTO header_image_edits (id, image_url, metadata) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [legacyId, imageUrl, JSON.stringify(cropData || {})]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy history
router.get('/history', authenticateToken, ensureAdmin, async (req, res) => {
  // Redirect to versions
  try {
    const result = await pool.query(
      'SELECT * FROM header_versions WHERE archived = false ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;