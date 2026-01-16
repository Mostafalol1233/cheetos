
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

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

// Save header image edit metadata
router.post('/save', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { imageUrl, cropData } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Save to header_image_edits table
    const result = await pool.query(
      'INSERT INTO header_image_edits (image_url, metadata) VALUES ($1, $2) RETURNING *',
      [imageUrl, JSON.stringify(cropData)]
    );

    // Also update the main settings to use this new header image
    await pool.query(
        'UPDATE settings SET header_image_url = $1, updated_at = EXTRACT(EPOCH FROM NOW()) * 1000',
        [imageUrl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving header image edit:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get recent edits
router.get('/history', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM header_image_edits ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching header image history:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
