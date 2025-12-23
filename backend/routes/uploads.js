import express from 'express';
import cloudinary from '../config/cloudinary.js';
import pool from '../db.js';
import { authenticateToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload/code-image', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { image, orderId } = req.body || {};
    if (!image || !orderId) return res.status(400).json({ message: 'image and orderId required' });

    const isDataUri = /^data:image\/(png|jpeg);base64,/i.test(image);
    const guessType = isDataUri ? (image.includes('png') ? 'png' : 'jpeg') : 'jpeg';
    const base64 = isDataUri ? image.split(',')[1] : image;
    const sizeBytes = Buffer.byteLength(base64, 'base64');
    if (sizeBytes > 5 * 1024 * 1024) return res.status(413).json({ message: 'Image too large' });
    if (!isDataUri && !/^[A-Za-z0-9+/=]+$/.test(base64)) return res.status(400).json({ message: 'Invalid base64 data' });

    const dataUri = `data:image/${guessType};base64,${base64}`;

    const folder = 'codes/private';
    const preset = process.env.CLOUDINARY_PRESET_CODE_AUTH || '';
    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder,
      type: 'authenticated',
      access_mode: 'authenticated',
      resource_type: 'image',
      upload_preset: preset || undefined,
      use_filename: true,
      unique_filename: true,
    });

    await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS code_image_public_id TEXT');
    await pool.query('UPDATE transactions SET code_image_public_id = $1 WHERE id = $2', [uploadRes.public_id, orderId]);

    res.status(201).json({ publicId: uploadRes.public_id, assetId: uploadRes.asset_id, secureUrl: uploadRes.secure_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

