import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { encryptText, decryptText, safePreview } from '../utils/crypto.js';

const router = express.Router();

function sanitize(input) {
  return String(input || '').replace(/[\r\n\t]/g, '').trim();
}

// Ensure table for encrypted codes
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_card_codes (
      id VARCHAR(60) PRIMARY KEY,
      game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
      package_name TEXT NOT NULL,
      code_encrypted TEXT NOT NULL,
      code_mask TEXT NOT NULL DEFAULT '',
      status VARCHAR(12) DEFAULT 'unused',
      used_order_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at TIMESTAMP
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_gcc_game_pkg_status ON game_card_codes(game_id, package_name, status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_gcc_used_order_id ON game_card_codes(used_order_id)`);
}

router.use(authenticateToken, ensureAdmin);

// List codes (admin) - do not expose plaintext; show preview only
router.get('/', async (req, res) => {
  try {
    await ensureSchema();
    const gameId = req.query.game_id ? String(req.query.game_id) : null;
    const pkg = req.query.package ? String(req.query.package) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const page = Math.max(1, parseInt(String(req.query.page || '1'))) || 1;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20')))) || 20;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];
    if (gameId) { params.push(gameId); where += ` AND game_id = $${params.length}`; }
    if (pkg) { params.push(pkg); where += ` AND package_name = $${params.length}`; }
    if (status) { params.push(status); where += ` AND status = $${params.length}`; }

    const rows = await pool.query(
      `SELECT id, game_id, package_name, code_encrypted, status, used_order_id, created_at, used_at
       FROM game_card_codes ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(*)::int AS c FROM game_card_codes ${where}`,
      params
    );

    const items = rows.rows.map(r => ({
      id: r.id,
      game_id: r.game_id,
      package_name: r.package_name,
      code_preview: r.code_mask || '****',
      status: r.status,
      used_order_id: r.used_order_id,
      created_at: r.created_at,
      used_at: r.used_at
    }));

    res.json({ items, page, limit, total: count.rows[0].c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import codes for a package
router.post('/import', async (req, res) => {
  try {
    await ensureSchema();
    const { game_id, package_name } = req.body || {};
    let codes = req.body?.codes;
    if (!game_id || !package_name) return res.status(400).json({ message: 'game_id and package_name required' });
    // Validate game exists
    const g = await pool.query('SELECT id FROM games WHERE id = $1', [String(game_id)]);
    if (!g.rows.length) return res.status(400).json({ message: 'Invalid game_id' });

    if (typeof codes === 'string') {
      // Split by newlines
      codes = codes.split(/\r?\n/).map(sanitize).filter(Boolean);
    }
    if (!Array.isArray(codes) || !codes.length) return res.status(400).json({ message: 'codes array required' });

    const toMask = (s) => {
      const str = String(s || '');
      // Keep last 4 visible digits/letters
      const alnum = str.replace(/[^A-Za-z0-9]/g, '');
      const last4 = alnum.slice(-4);
      return `XXXX-XXXX-${last4 || '****'}`;
    };

    let created = 0, skipped = 0, invalid = 0;
    for (const raw of codes) {
      try {
        const code = sanitize(raw);
        if (code.length < 5 || code.length > 500) { invalid++; continue; }
        const id = `gcc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const enc = encryptText(code);
        const mask = toMask(code);
        await pool.query(
          'INSERT INTO game_card_codes (id, game_id, package_name, code_encrypted, code_mask, status) VALUES ($1,$2,$3,$4,$5,$6)',
          [id, String(game_id), String(package_name), enc, mask, 'unused']
        );
        created++;
      } catch (e) {
        skipped++;
      }
    }
    await logAudit('cards_import', `Imported codes for ${game_id}/${package_name}: created=${created}, skipped=${skipped}, invalid=${invalid}`, req.user);
    res.json({ created, skipped, invalid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark used or update status
router.put('/:id', async (req, res) => {
  try {
    await ensureSchema();
    const { id } = req.params;
    const status = req.body?.status ? String(req.body.status) : undefined;
    const used_order_id = req.body?.used_order_id ? String(req.body.used_order_id) : undefined;
    const result = await pool.query(
      'UPDATE game_card_codes SET status = COALESCE($1, status), used_order_id = COALESCE($2, used_order_id), used_at = CASE WHEN $1 = ' + "'used'" + ' THEN CURRENT_TIMESTAMP ELSE used_at END WHERE id = $3 RETURNING *',
      [status, used_order_id, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    await logAudit('cards_update', `Updated card ${id} -> ${status || 'no-change'}`, req.user);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
