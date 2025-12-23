import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import { storage as memStorage } from '../storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{2,}$/.test(slug);
}

function isValidId(id) {
  return typeof id === 'string' && id.length >= 2;
}

function verifyImagePath(image) {
  try {
    if (!image || typeof image !== 'string') return { exists: false, path: null };
    const rel = image.replace(/^\/+/, '');
    let abs = null;
    if (rel.startsWith('attached_assets/')) {
      abs = path.join(__dirname, '..', 'public', rel);
    } else {
      abs = path.join(__dirname, '..', 'public', rel);
    }
    const exists = fs.existsSync(abs);
    return { exists, path: abs };
  } catch {
    return { exists: false, path: null };
  }
}

function buildVerification(game) {
  const errors = [];
  const warnings = [];
  const checks = {
    hasId: Boolean(game?.id),
    hasName: Boolean(game?.name && String(game.name).trim().length >= 2),
    hasSlug: Boolean(game?.slug && isValidSlug(game.slug)),
    hasImage: Boolean(game?.image),
    priceValid: !isNaN(Number(game?.price)) && Number(game?.price) >= 0,
    currencyValid: Boolean(game?.currency),
    stockValid: typeof game?.stock === 'number' && game.stock >= 0,
    packagesAligned: Array.isArray(game?.packages) && Array.isArray(game?.packagePrices) ? game.packages.length === game.packagePrices.length : true,
    imageExists: false,
  };

  const img = verifyImagePath(game?.image);
  checks.imageExists = img.exists;
  if (!checks.hasId) errors.push('Missing id');
  if (!checks.hasName) errors.push('Missing or invalid name');
  if (!checks.hasSlug) errors.push('Missing or invalid slug');
  if (!checks.hasImage) warnings.push('Image not set');
  if (!checks.priceValid) errors.push('Invalid price');
  if (!checks.currencyValid) warnings.push('Currency not set');
  if (!checks.stockValid) warnings.push('Invalid stock');
  if (!checks.packagesAligned) warnings.push('packages and packagePrices length mismatch');
  if (checks.hasImage && !checks.imageExists) warnings.push('Image file missing');

  return {
    ok: errors.length === 0,
    checks,
    errors,
    warnings,
    imagePath: img.path,
    game,
  };
}

async function getGameBySlug(slug) {
  try {
    const q = await pool.query('SELECT id, name, slug, description, price, currency, image, category, is_popular as isPopular, stock, packages, package_prices as packagePrices FROM games WHERE slug = $1 LIMIT 1', [slug]);
    if (q.rows?.length) return q.rows[0];
  } catch {}
  return await memStorage.getGameBySlug(slug);
}

async function getGameById(id) {
  try {
    const q = await pool.query('SELECT id, name, slug, description, price, currency, image, category, is_popular as isPopular, stock, packages, package_prices as packagePrices FROM games WHERE id = $1 LIMIT 1', [id]);
    if (q.rows?.length) return q.rows[0];
  } catch {}
  return await memStorage.getGameById(id);
}

router.post('/api/games/verify', async (req, res) => {
  try {
    const { slug, id } = req.body || {};
    if (!slug && !id) return res.status(400).json({ message: 'Provide slug or id' });
    let game = null;
    if (slug) {
      if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug format' });
      game = await getGameBySlug(slug);
    } else if (id) {
      if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });
      game = await getGameById(id);
    }
    if (!game) return res.status(404).json({ message: 'Game not found' });
    const report = buildVerification(game);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/api/games/verify/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!isValidSlug(slug)) return res.status(400).json({ message: 'Invalid slug format' });
    const game = await getGameBySlug(slug);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(buildVerification(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/api/games/verify/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });
    const game = await getGameById(id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(buildVerification(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/api/games/verify/all', async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
    let games = [];
    try {
      const r = await pool.query('SELECT id, name, slug, description, price, currency, image, category, is_popular as isPopular, stock, packages, package_prices as packagePrices FROM games ORDER BY id DESC LIMIT $1', [limit]);
      games = r.rows;
    } catch {
      games = await memStorage.getGames();
    }
    const results = games.slice(0, limit).map(buildVerification);
    const okCount = results.filter(r => r.ok).length;
    res.json({ total: results.length, ok: okCount, issues: results.length - okCount, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

