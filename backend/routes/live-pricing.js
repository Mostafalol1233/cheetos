import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, ensureAdmin);

const EXCHANGE_API = 'https://open.er-api.com/v6/latest/USD';
const THRESHOLD_INSTANT = 5; // % change that triggers note of big change

async function fetchLiveRate() {
  const res = await fetch(EXCHANGE_API, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Exchange API returned ${res.status}`);
  const data = await res.json();
  const rate = data?.rates?.EGP;
  if (!rate || typeof rate !== 'number') throw new Error('EGP rate not found in API response');
  return parseFloat(rate.toFixed(4));
}

async function getSettings() {
  const result = await pool.query('SELECT * FROM live_pricing_settings WHERE id = $1', ['default']);
  if (result.rows.length === 0) {
    await pool.query(
      `INSERT INTO live_pricing_settings (id, enabled, usd_egp_rate, global_discount_egp)
       VALUES ('default', false, 0, 0) ON CONFLICT (id) DO NOTHING`
    );
    return { id: 'default', enabled: false, usd_egp_rate: 0, global_discount_egp: 0, last_rate_update: null, last_applied: null };
  }
  return result.rows[0];
}

// GET /api/admin/live-pricing/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      enabled: settings.enabled,
      usdEgpRate: parseFloat(settings.usd_egp_rate) || 0,
      globalDiscountEgp: parseFloat(settings.global_discount_egp) || 0,
      lastRateUpdate: settings.last_rate_update,
      lastApplied: settings.last_applied,
    });
  } catch (err) {
    console.error('Live pricing get settings error:', err);
    res.status(500).json({ message: 'Failed to load settings' });
  }
});

// PUT /api/admin/live-pricing/settings
router.put('/settings', async (req, res) => {
  try {
    const { enabled, globalDiscountEgp } = req.body;
    const settings = await getSettings();

    const newEnabled = enabled !== undefined ? Boolean(enabled) : settings.enabled;
    const newDiscount = globalDiscountEgp !== undefined ? parseFloat(globalDiscountEgp) || 0 : parseFloat(settings.global_discount_egp) || 0;

    await pool.query(
      `UPDATE live_pricing_settings SET enabled = $1, global_discount_egp = $2 WHERE id = 'default'`,
      [newEnabled, newDiscount]
    );

    res.json({ ok: true, enabled: newEnabled, globalDiscountEgp: newDiscount });
  } catch (err) {
    console.error('Live pricing update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// POST /api/admin/live-pricing/fetch-rate
router.post('/fetch-rate', async (req, res) => {
  try {
    const newRate = await fetchLiveRate();
    const settings = await getSettings();
    const oldRate = parseFloat(settings.usd_egp_rate) || 0;

    let changePct = 0;
    let bigChange = false;
    if (oldRate > 0) {
      changePct = Math.abs((newRate - oldRate) / oldRate) * 100;
      bigChange = changePct >= THRESHOLD_INSTANT;
    }

    await pool.query(
      `UPDATE live_pricing_settings SET usd_egp_rate = $1, last_rate_update = NOW() WHERE id = 'default'`,
      [newRate]
    );

    res.json({
      ok: true,
      rate: newRate,
      previousRate: oldRate,
      changePct: parseFloat(changePct.toFixed(2)),
      bigChange,
      message: bigChange
        ? `⚠️ تغيير كبير! السعر تغير ${changePct.toFixed(1)}% — يُنصح بتطبيق الأسعار فوراً`
        : `✅ تم جلب السعر: 1 USD = ${newRate} EGP`,
    });
  } catch (err) {
    console.error('Live pricing fetch rate error:', err);
    res.status(500).json({ message: `Failed to fetch exchange rate: ${err.message}` });
  }
});

// GET /api/admin/live-pricing/packages
router.get('/packages', async (req, res) => {
  try {
    const settings = await getSettings();
    const rate = parseFloat(settings.usd_egp_rate) || 0;
    const discount = parseFloat(settings.global_discount_egp) || 0;

    const result = await pool.query(`
      SELECT gp.id, gp.game_id, gp.name, gp.price, gp.discount_price,
             gp.price_usd, gp.original_price_egp, gp.bonus, gp.image,
             g.name as game_name
      FROM game_packages gp
      LEFT JOIN games g ON g.id = gp.game_id
      ORDER BY g.name, gp.price ASC
    `);

    const packages = result.rows.map(pkg => {
      const priceUsd = parseFloat(pkg.price_usd) || null;
      const calculated = priceUsd && rate > 0
        ? Math.max(0, parseFloat((priceUsd * rate - discount).toFixed(2)))
        : null;
      return {
        id: pkg.id,
        gameId: pkg.game_id,
        gameName: pkg.game_name,
        name: pkg.name,
        priceEgp: parseFloat(pkg.price) || 0,
        discountPrice: pkg.discount_price ? parseFloat(pkg.discount_price) : null,
        priceUsd: priceUsd,
        originalPriceEgp: pkg.original_price_egp ? parseFloat(pkg.original_price_egp) : null,
        calculatedEgp: calculated,
        bonus: pkg.bonus,
        image: pkg.image,
      };
    });

    res.json({ packages, settings: { usdEgpRate: rate, globalDiscountEgp: discount, enabled: settings.enabled } });
  } catch (err) {
    console.error('Live pricing get packages error:', err);
    res.status(500).json({ message: 'Failed to load packages' });
  }
});

// PUT /api/admin/live-pricing/package/:id
router.put('/package/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { priceUsd } = req.body;
    const usd = priceUsd !== null && priceUsd !== '' ? parseFloat(priceUsd) : null;

    await pool.query(
      'UPDATE game_packages SET price_usd = $1 WHERE id = $2',
      [usd, parseInt(id)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Live pricing update package error:', err);
    res.status(500).json({ message: 'Failed to update package USD price' });
  }
});

// POST /api/admin/live-pricing/apply
// Applies current rate × USD price - discount → writes to price column
router.post('/apply', async (req, res) => {
  try {
    const settings = await getSettings();
    const rate = parseFloat(settings.usd_egp_rate);
    const discount = parseFloat(settings.global_discount_egp) || 0;

    if (!rate || rate <= 0) {
      return res.status(400).json({ message: 'يجب جلب سعر الصرف أولاً' });
    }

    // Get all packages with price_usd set
    const pkgResult = await pool.query(
      'SELECT id, price, price_usd FROM game_packages WHERE price_usd IS NOT NULL AND price_usd > 0'
    );

    if (pkgResult.rows.length === 0) {
      return res.status(400).json({ message: 'لا توجد باقات بسعر دولار محدد. حدد سعر الدولار لكل باقة أولاً.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let updated = 0;
      for (const pkg of pkgResult.rows) {
        const priceUsd = parseFloat(pkg.price_usd);
        const newPrice = Math.max(1, parseFloat((priceUsd * rate - discount).toFixed(2)));
        const originalEgp = parseFloat(pkg.price) || 0;

        await client.query(
          `UPDATE game_packages
           SET price = $1,
               original_price_egp = COALESCE(original_price_egp, $2)
           WHERE id = $3`,
          [newPrice, originalEgp, pkg.id]
        );
        updated++;
      }

      // Enable live pricing and record apply time
      await client.query(
        `UPDATE live_pricing_settings SET enabled = true, last_applied = NOW() WHERE id = 'default'`
      );

      await client.query('COMMIT');
      res.json({
        ok: true,
        updated,
        rate,
        discount,
        message: `✅ تم تحديث ${updated} باقة — 1 USD = ${rate} EGP، خصم ${discount} EGP لكل باقة`,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Live pricing apply error:', err);
    res.status(500).json({ message: `Failed to apply prices: ${err.message}` });
  }
});

// POST /api/admin/live-pricing/reset
// Restores original EGP prices and disables live pricing
router.post('/reset', async (req, res) => {
  try {
    const pkgResult = await pool.query(
      'SELECT id, original_price_egp FROM game_packages WHERE original_price_egp IS NOT NULL'
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let restored = 0;
      for (const pkg of pkgResult.rows) {
        await client.query(
          'UPDATE game_packages SET price = $1, original_price_egp = NULL WHERE id = $2',
          [parseFloat(pkg.original_price_egp), pkg.id]
        );
        restored++;
      }

      await client.query(
        `UPDATE live_pricing_settings SET enabled = false, last_applied = NULL WHERE id = 'default'`
      );

      await client.query('COMMIT');
      res.json({
        ok: true,
        restored,
        message: restored > 0
          ? `✅ تم استعادة ${restored} باقة للأسعار الأصلية`
          : '✅ تم إيقاف الأسعار التلقائية (لم تُطبَّق أسعار بعد)',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Live pricing reset error:', err);
    res.status(500).json({ message: `Reset failed: ${err.message}` });
  }
});

export default router;
