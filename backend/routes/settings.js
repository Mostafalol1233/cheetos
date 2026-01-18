import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

// Default settings fallback
const defaultSettings = {
    id: 'default',
    primaryColor: '#FFCC00',
    accentColor: '#0066FF',
    logoUrl: null,
    headerImageUrl: null,
    whatsappNumber: '+201011696196',
    trustBadges: null,
    footerText: null,
    bonusPercent: 0
};

// Get settings (public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings LIMIT 1');
        if (result.rows.length > 0) {
            // Merge with defaults for any missing fields
            res.json({ ...defaultSettings, ...result.rows[0] });
        } else {
            res.json(defaultSettings);
        }
    } catch (err) {
        console.error('Error fetching settings:', err.message);
        // If table doesn't exist, return defaults
        if (err.code === '42P01') {
            return res.json(defaultSettings);
        }
        res.status(500).json({ message: "Failed to load settings" });
    }
});

// Update settings (admin)
router.put('/', authenticateToken, ensureAdmin, async (req, res) => {
    try {
        const {
            primaryColor, accentColor, logoUrl, headerImageUrl,
            whatsappNumber, trustBadges, footerText, bonusPercent
        } = req.body;

        // Check if settings row exists
        const existing = await pool.query('SELECT id FROM settings LIMIT 1');

        if (existing.rows.length > 0) {
            // Update existing
            await pool.query(`
        UPDATE settings SET
          primary_color = COALESCE($1, primary_color),
          accent_color = COALESCE($2, accent_color),
          logo_url = COALESCE($3, logo_url),
          header_image_url = COALESCE($4, header_image_url),
          whatsapp_number = COALESCE($5, whatsapp_number),
          trust_badges = COALESCE($6, trust_badges),
          footer_text = COALESCE($7, footer_text),
          bonus_percent = COALESCE($8, bonus_percent),
          updated_at = NOW()
        WHERE id = $9
      `, [
                primaryColor, accentColor, logoUrl, headerImageUrl,
                whatsappNumber, trustBadges, footerText, bonusPercent,
                existing.rows[0].id
            ]);
        } else {
            // Insert new
            await pool.query(`
        INSERT INTO settings (
          id, primary_color, accent_color, logo_url, header_image_url,
          whatsapp_number, trust_badges, footer_text, bonus_percent
        ) VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8)
      `, [
                primaryColor || defaultSettings.primaryColor,
                accentColor || defaultSettings.accentColor,
                logoUrl, headerImageUrl,
                whatsappNumber || defaultSettings.whatsappNumber,
                trustBadges, footerText, bonusPercent || 0
            ]);
        }

        // Return updated settings
        const updated = await pool.query('SELECT * FROM settings LIMIT 1');
        res.json({ ...defaultSettings, ...updated.rows[0], message: 'Settings updated' });
    } catch (err) {
        console.error('Error updating settings:', err.message);

        // If table doesn't exist, try to create it
        if (err.code === '42P01') {
            try {
                await pool.query(`
          CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
            primary_color VARCHAR(50),
            accent_color VARCHAR(50),
            logo_url TEXT,
            header_image_url TEXT,
            whatsapp_number VARCHAR(50),
            trust_badges JSONB,
            footer_text TEXT,
            bonus_percent DECIMAL(5,2) DEFAULT 0,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
                // Retry the update
                return router.handle(req, res);
            } catch (createErr) {
                console.error('Failed to create settings table:', createErr.message);
            }
        }

        res.status(500).json({ message: "Failed to update settings" });
    }
});

export default router;
