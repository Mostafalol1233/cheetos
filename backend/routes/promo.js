import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_type VARCHAR(10) NOT NULL DEFAULT 'percent',
      discount_value DECIMAL(10,2) NOT NULL,
      min_order_amount DECIMAL(10,2) DEFAULT 0,
      max_uses INTEGER DEFAULT NULL,
      used_count INTEGER DEFAULT 0,
      expires_at BIGINT DEFAULT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `);
};
initTable().catch(console.error);

router.post('/validate', async (req, res) => {
  const { code, order_total } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });

  try {
    const result = await pool.query(
      'SELECT * FROM promo_codes WHERE UPPER(code) = UPPER($1) AND is_active = true',
      [code]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired promo code' });
    }

    const promo = result.rows[0];

    if (promo.expires_at && Date.now() > Number(promo.expires_at)) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    const orderAmount = parseFloat(order_total) || 0;
    if (promo.min_order_amount > 0 && orderAmount < promo.min_order_amount) {
      return res.status(400).json({ message: `Minimum order amount is ${promo.min_order_amount} EGP` });
    }

    let discount = 0;
    if (promo.discount_type === 'percent') {
      discount = (orderAmount * parseFloat(promo.discount_value)) / 100;
    } else {
      discount = parseFloat(promo.discount_value);
    }
    discount = Math.min(discount, orderAmount);

    res.json({ valid: true, promo, discount: parseFloat(discount.toFixed(2)) });
  } catch (err) {
    console.error('Promo validate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/apply', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });
  try {
    await pool.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)', [code]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, ensureAdmin, async (req, res) => {
  const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;
  if (!code || discount_value === undefined) {
    return res.status(400).json({ message: 'Code and discount_value are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
       VALUES (UPPER($1), $2, $3, $4, $5, $6) RETURNING *`,
      [code, discount_type || 'percent', discount_value, min_order_amount || 0, max_uses || null, expires_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Promo code already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE promo_codes SET
        code = COALESCE(UPPER($1), code),
        discount_type = COALESCE($2, discount_type),
        discount_value = COALESCE($3, discount_value),
        min_order_amount = COALESCE($4, min_order_amount),
        max_uses = $5,
        expires_at = $6,
        is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [code, discount_type, discount_value, min_order_amount, max_uses ?? null, expires_at ?? null, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM promo_codes WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
