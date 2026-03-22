import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(200) NOT NULL,
      name VARCHAR(200),
      phone VARCHAR(50),
      items JSONB NOT NULL,
      total_amount DECIMAL(10,2),
      reminder_sent BOOLEAN DEFAULT false,
      recovered BOOLEAN DEFAULT false,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `);
};
initTable().catch(console.error);

router.post('/save', async (req, res) => {
  const { email, name, phone, items, total_amount } = req.body;
  if (!email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Email and items required' });
  }
  try {
    const existing = await pool.query(
      'SELECT id FROM abandoned_carts WHERE email = $1 AND recovered = false ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE abandoned_carts SET items = $1, total_amount = $2, name = $3, phone = $4,
         updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000), reminder_sent = false
         WHERE id = $5`,
        [JSON.stringify(items), total_amount || 0, name || null, phone || null, existing.rows[0].id]
      );
      return res.json({ success: true, updated: true });
    }
    await pool.query(
      `INSERT INTO abandoned_carts (email, name, phone, items, total_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, name || null, phone || null, JSON.stringify(items), total_amount || 0]
    );
    res.json({ success: true, created: true });
  } catch (err) {
    console.error('Abandoned cart save error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/recover', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    await pool.query(
      'UPDATE abandoned_carts SET recovered = true WHERE email = $1 AND recovered = false',
      [email]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM abandoned_carts ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export function startAbandonedCartSchedule(sendEmail, sendWhatsApp) {
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const CHECK_INTERVAL = 15 * 60 * 1000;

  setInterval(async () => {
    try {
      const cutoff = Date.now() - THIRTY_MINUTES;
      const result = await pool.query(
        `SELECT * FROM abandoned_carts
         WHERE reminder_sent = false AND recovered = false AND created_at < $1
         LIMIT 20`,
        [cutoff]
      );

      for (const cart of result.rows) {
        try {
          const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items;
          const itemList = items.map(i => `• ${i.name} — ${i.price} EGP`).join('\n');

          if (sendEmail && cart.email) {
            await sendEmail({
              to: cart.email,
              subject: 'You left something in your cart! 🛒',
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#D4AF37;">Don't forget your order! 🎮</h2>
                  <p>Hi ${cart.name || 'there'},</p>
                  <p>You left these items in your cart at متجر ضياء:</p>
                  <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0;">
                    ${items.map(i => `<div style="padding:5px 0;border-bottom:1px solid #ddd;">
                      <strong>${i.name}</strong> — ${i.price} EGP
                    </div>`).join('')}
                    <div style="padding:10px 0;font-weight:bold;font-size:16px;">
                      Total: ${cart.total_amount} EGP
                    </div>
                  </div>
                  <a href="https://diaa.store/checkout" style="background:#D4AF37;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                    Complete Your Order →
                  </a>
                  <p style="color:#888;font-size:12px;margin-top:20px;">متجر ضياء — Egyptian Gaming Store</p>
                </div>
              `
            });
          }

          await pool.query(
            'UPDATE abandoned_carts SET reminder_sent = true WHERE id = $1',
            [cart.id]
          );
        } catch (err) {
          console.error('Failed to send abandoned cart reminder for', cart.email, err);
        }
      }
    } catch (err) {
      console.error('Abandoned cart schedule error:', err);
    }
  }, CHECK_INTERVAL);
}

export default router;
