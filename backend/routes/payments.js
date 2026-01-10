import express from 'express';
import pool from '../db.js';
import { sendRawEmail } from '../utils/email.js';
import { decryptText } from '../utils/crypto.js';

const router = express.Router();

// Create a mock payment session (future-proof for real gateway)
router.post('/session', async (req, res) => {
  try {
    const { orderId, amount, currency } = req.body || {};
    if (!orderId || !Number(amount)) return res.status(400).json({ message: 'orderId and amount required' });
    const sessionId = `ps_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    res.json({ id: sessionId, url: `${process.env.FRONTEND_URL || ''}/payment/mock-success?orderId=${encodeURIComponent(orderId)}&sessionId=${sessionId}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirm payment success (mock)
router.post('/confirm', async (req, res) => {
  try {
    const { orderId, game_id, package_name, customer_email } = req.body || {};
    if (!orderId || !game_id || !package_name || !customer_email) return res.status(400).json({ message: 'orderId, game_id, package_name, customer_email required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Mark order paid (best-effort)
      try { await client.query("UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1", [orderId]); } catch {}
      // Select an available code and lock it
      await client.query(`CREATE TABLE IF NOT EXISTS game_card_codes (
        id VARCHAR(60) PRIMARY KEY,
        game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
        package_name TEXT NOT NULL,
        code_encrypted TEXT NOT NULL,
        code_mask TEXT NOT NULL DEFAULT '',
        status VARCHAR(12) DEFAULT 'unused',
        used_order_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )`);
      const pick = await client.query(
        "SELECT id, code_encrypted FROM game_card_codes WHERE game_id = $1 AND package_name = $2 AND status = 'unused' ORDER BY created_at ASC LIMIT 1 FOR UPDATE",
        [String(game_id), String(package_name)]
      );
      if (!pick.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'No available codes' });
      }
      const { id: codeId, code_encrypted } = pick.rows[0];
      // Decrypt code (keep transaction open to hold lock)
      let codePlain = '';
      try { codePlain = decryptText(code_encrypted); } catch (e) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: 'Failed to decrypt code' });
      }
      // Attempt to email BEFORE marking used; if email fails, keep transaction rolled back so code is not consumed
      const ok = await sendRawEmail(
        String(customer_email),
        `Your game card code for ${package_name}`,
        `Code: ${codePlain}`,
        `<div style=\"font-family:sans-serif\">Your code: <strong>${codePlain}</strong></div>`
      );
      if (!ok) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: 'Email delivery failed' });
      }
      // Email succeeded, mark code used and commit
      await client.query(
        "UPDATE game_card_codes SET status = 'used', used_order_id = $1, used_at = NOW() WHERE id = $2",
        [orderId, codeId]
      );
      await client.query('COMMIT');
      return res.json({ ok: true, codeAssigned: true });
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).json({ message: e.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
