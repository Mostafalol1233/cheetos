import express from 'express';
import pool from '../db.js';
import { authenticateToken, verifyOrderOwnership } from '../middleware/auth.js';
import { generateSignedUrl, canIssueForOrder, markIssued } from '../utils/urlSigner.js';

const router = express.Router();

router.get('/orders/:id/code-image', authenticateToken, verifyOrderOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || null;
    const ttl = parseInt(process.env.CLOUDINARY_SIGN_TTL || '600', 10);
    const singleUse = String(process.env.CLOUDINARY_SINGLE_USE || 'true') === 'true';

    const r = await pool.query('SELECT code_image_public_id, status FROM transactions WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    if (!r.rows[0].code_image_public_id) return res.status(404).json({ message: 'Code image not available' });
    if (r.rows[0].status !== 'paid') return res.status(403).json({ message: 'Payment not verified' });

    if (!canIssueForOrder(id, ip, singleUse)) return res.status(429).json({ message: 'Single-use link already issued' });
    const { url, expiresAt } = generateSignedUrl(r.rows[0].code_image_public_id, ttl, ip, singleUse);
    markIssued(id, ip);

    const auditId = `pa_${Date.now()}`;
    await pool.query('INSERT INTO payment_audit_logs (id, transaction_id, action, summary) VALUES ($1, $2, $3, $4)', [auditId, id, 'code_image_access', `Signed URL issued, expiresAt=${new Date(expiresAt).toISOString()} ip=${ip}`]);

    res.json({ url, expiresAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

