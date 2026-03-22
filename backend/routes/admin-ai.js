import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import * as https from 'https';

const router = express.Router();

const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-flash';
const AI_API_KEY = (process.env.AI_API_KEY || '').trim();

function httpsPostJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const req = https.request(
        {
          hostname: u.hostname,
          port: u.port || 443,
          path: u.pathname + u.search,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
        },
        (res) => {
          let chunks = '';
          res.on('data', (d) => {
            chunks += d;
          });
          res.on('end', () => {
            resolve({ status: res.statusCode || 0, body: chunks });
          });
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify(body || {}));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function normalizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function isFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n);
}

const ALLOWED_ACTIONS = new Set([
  'set_game_price',
  'set_game_discount',
  'set_game_stock',
  'set_package_price',
  'set_package_discount',
  'bulk_add_cards',
]);

function normalizePackageName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

function findPackageByName(packages, target) {
  if (!Array.isArray(packages) || !target) return null;
  const normTarget = normalizePackageName(target);
  const exact = packages.find(p => normalizePackageName(p.name || p.amount || '') === normTarget);
  if (exact) return exact;
  const fuzzy = packages.find(p => {
    const norm = normalizePackageName(p.name || p.amount || '');
    return norm.includes(normTarget) || normTarget.includes(norm);
  });
  return fuzzy || null;
}

function validatePlannedAction(a) {
  if (!a || typeof a !== 'object') return { ok: false, message: 'Invalid action object' };
  if (!ALLOWED_ACTIONS.has(a.type)) return { ok: false, message: `Action type not allowed: ${String(a.type)}` };

  if (['set_game_price', 'set_game_discount', 'set_game_stock'].includes(a.type)) {
    const slug = normalizeSlug(a.gameSlug);
    if (!slug) return { ok: false, message: 'gameSlug required' };

    if (a.type === 'set_game_stock') {
      const stock = Number(a.stock);
      if (!Number.isInteger(stock) || stock < 0) return { ok: false, message: 'stock must be a non-negative integer' };
      return { ok: true, value: { type: a.type, gameSlug: slug, stock } };
    }

    if (a.type === 'set_game_price') {
      const price = Number(a.price);
      if (!isFiniteNumber(price) || price < 0) return { ok: false, message: 'price must be a non-negative number' };
      return { ok: true, value: { type: a.type, gameSlug: slug, price } };
    }

    if (a.type === 'set_game_discount') {
      const discountPrice = a.discountPrice === null || a.discountPrice === '' || a.discountPrice === undefined
        ? null
        : Number(a.discountPrice);
      if (discountPrice !== null && (!isFiniteNumber(discountPrice) || discountPrice < 0)) {
        return { ok: false, message: 'discountPrice must be null or a non-negative number' };
      }
      return { ok: true, value: { type: a.type, gameSlug: slug, discountPrice } };
    }
  }

  if (['set_package_price', 'set_package_discount'].includes(a.type)) {
    const gameSlug = normalizeSlug(a.gameSlug);
    const packageName = String(a.packageName || '').trim();
    if (!gameSlug) return { ok: false, message: 'gameSlug required' };
    if (!packageName) return { ok: false, message: 'packageName required' };

    if (a.type === 'set_package_price') {
      const price = Number(a.price);
      if (!isFiniteNumber(price) || price < 0) return { ok: false, message: 'price must be a non-negative number' };
      return { ok: true, value: { type: a.type, gameSlug, packageName, price } };
    }

    const discountPrice = a.discountPrice === null || a.discountPrice === '' || a.discountPrice === undefined
      ? null
      : Number(a.discountPrice);
    if (discountPrice !== null && (!isFiniteNumber(discountPrice) || discountPrice < 0)) {
      return { ok: false, message: 'discountPrice must be null or a non-negative number' };
    }
    return { ok: true, value: { type: a.type, gameSlug, packageName, discountPrice } };
  }

  if (a.type === 'bulk_add_cards') {
    const gameSlug = normalizeSlug(a.gameSlug);
    const cards = Array.isArray(a.cards) ? a.cards.map((c) => String(c || '').trim()).filter(Boolean) : [];
    if (!gameSlug) return { ok: false, message: 'gameSlug required' };
    if (cards.length === 0) return { ok: false, message: 'cards array required' };
    if (cards.some((c) => c.length < 5 || c.length > 200)) return { ok: false, message: 'one or more card codes invalid length' };
    return { ok: true, value: { type: a.type, gameSlug, cards } };
  }

  return { ok: false, message: 'Unhandled action type' };
}

function extractJson(text) {
  if (!text) return null;
  const s = String(text);
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = s.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function fallbackPlanFromPrompt(prompt) {
  const p = String(prompt || '').trim();
  const out = [];

  // English: "set <slug> price to 123"
  // Arabic-ish: "خلي سعر <slug> 123" / "غير سعر <slug> إلى 123"
  const mPrice = p.match(/(?:set|change|update|make|خلي|غير)\s+(?:game\s+)?(?:price\s+)?([a-z0-9\-_ ]+)\s+(?:price\s+)?(?:to|=|إلى)?\s*(\d+(?:\.\d+)?)/i);
  if (mPrice) {
    out.push({ type: 'set_game_price', gameSlug: normalizeSlug(mPrice[1]), price: Number(mPrice[2]) });
  }

  const mDiscount = p.match(/(?:discount|خصم|تخفيض)\s+(?:for\s+)?([a-z0-9\-_ ]+)\s+(?:to|=|إلى)?\s*(\d+(?:\.\d+)?)/i);
  if (mDiscount) {
    out.push({ type: 'set_game_discount', gameSlug: normalizeSlug(mDiscount[1]), discountPrice: Number(mDiscount[2]) });
  }

  const mStock = p.match(/(?:stock|quantity|qty|مخزون)\s+(?:for\s+)?([a-z0-9\-_ ]+)\s+(?:to|=|إلى)?\s*(\d+)/i);
  if (mStock) {
    out.push({ type: 'set_game_stock', gameSlug: normalizeSlug(mStock[1]), stock: Number(mStock[2]) });
  }

  return out;
}

async function generatePlanWithGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(AI_MODEL)}:generateContent?key=${encodeURIComponent(AI_API_KEY)}`;
  const system =
    'You are an admin assistant for an e-commerce dashboard. Output ONLY valid JSON with this shape: { "actions": [ ... ] }. ' +
    'Each action must be one of these types: set_game_price, set_game_discount, set_game_stock, set_package_price, set_package_discount, bulk_add_cards. ' +
    'Fields: gameSlug, price, discountPrice (or null), stock, packageName, cards[]. Do not include any other action types.';

  const body = {
    contents: [
      { role: 'user', parts: [{ text: `${system}\n\nUser request:\n${prompt}` }] },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  };

  const r = await httpsPostJson(url, {}, body);
  if (!r.status || r.status < 200 || r.status >= 300) {
    throw new Error(`AI request failed (${r.status})`);
  }

  let parsed = null;
  try {
    parsed = JSON.parse(r.body);
  } catch {
    parsed = null;
  }

  const text =
    parsed?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('\n') ||
    parsed?.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';

  const json = extractJson(text) || extractJson(r.body);
  if (!json || typeof json !== 'object') {
    throw new Error('AI response did not contain valid JSON');
  }
  return json;
}

async function resolveGameIdBySlugOrId(gameSlug) {
  const s = String(gameSlug || '').trim();
  const res = await pool.query('SELECT id, slug FROM games WHERE slug = $1 OR id = $1 LIMIT 1', [s]);
  if (res.rows.length === 0) return null;
  return res.rows[0].id;
}

async function applyAction(action, reqUser) {
  if (action.type === 'set_game_price') {
    const gameId = await resolveGameIdBySlugOrId(action.gameSlug);
    if (!gameId) return { ok: false, message: `Game not found: ${action.gameSlug}` };
    await pool.query('UPDATE games SET price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [gameId, action.price]);
    await logAudit('ai_set_game_price', `AI set price for ${action.gameSlug} to ${action.price}`, reqUser);
    return { ok: true };
  }

  if (action.type === 'set_game_discount') {
    const gameId = await resolveGameIdBySlugOrId(action.gameSlug);
    if (!gameId) return { ok: false, message: `Game not found: ${action.gameSlug}` };
    await pool.query('UPDATE games SET discount_price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [gameId, action.discountPrice]);
    await logAudit('ai_set_game_discount', `AI set discount for ${action.gameSlug} to ${action.discountPrice}`, reqUser);
    return { ok: true };
  }

  if (action.type === 'set_game_stock') {
    const gameId = await resolveGameIdBySlugOrId(action.gameSlug);
    if (!gameId) return { ok: false, message: `Game not found: ${action.gameSlug}` };
    await pool.query('UPDATE games SET stock = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [gameId, action.stock]);
    await logAudit('ai_set_game_stock', `AI set stock for ${action.gameSlug} to ${action.stock}`, reqUser);
    return { ok: true };
  }

  if (action.type === 'set_package_price') {
    const gameId = await resolveGameIdBySlugOrId(action.gameSlug);
    if (!gameId) return { ok: false, message: `Game not found: ${action.gameSlug}` };
    const pkgRes = await pool.query('SELECT * FROM game_packages WHERE game_id = $1 ORDER BY price ASC', [gameId]);
    if (!pkgRes.rows.length) return { ok: false, message: `No packages found for game: ${action.gameSlug}` };
    const available = pkgRes.rows.map(p => ({ id: p.id, name: p.name, amount: p.name }));
    const match = findPackageByName(available, action.packageName);
    if (!match) {
      const names = available.map(p => p.name || p.amount).filter(Boolean).join(', ');
      return { ok: false, message: `Package "${action.packageName}" not found for game "${action.gameSlug}". Available packages: ${names}` };
    }
    await pool.query('UPDATE game_packages SET price = $2 WHERE id = $1', [match.id, action.price]);
    await logAudit('ai_set_package_price', `AI set package price for ${action.gameSlug} / ${match.name} to ${action.price}`, reqUser);
    return { ok: true };
  }

  if (action.type === 'set_package_discount') {
    const gameId = await resolveGameIdBySlugOrId(action.gameSlug);
    if (!gameId) return { ok: false, message: `Game not found: ${action.gameSlug}` };
    const pkgRes = await pool.query('SELECT * FROM game_packages WHERE game_id = $1 ORDER BY price ASC', [gameId]);
    if (!pkgRes.rows.length) return { ok: false, message: `No packages found for game: ${action.gameSlug}` };
    const available = pkgRes.rows.map(p => ({ id: p.id, name: p.name, amount: p.name }));
    const match = findPackageByName(available, action.packageName);
    if (!match) {
      const names = available.map(p => p.name || p.amount).filter(Boolean).join(', ');
      return { ok: false, message: `Package "${action.packageName}" not found for game "${action.gameSlug}". Available packages: ${names}` };
    }
    await pool.query('UPDATE game_packages SET discount_price = $2 WHERE id = $1', [match.id, action.discountPrice]);
    await logAudit('ai_set_package_discount', `AI set package discount for ${action.gameSlug} / ${match.name} to ${action.discountPrice}`, reqUser);
    return { ok: true };
  }

  if (action.type === 'bulk_add_cards') {
    const gameId = await resolveGameIdBySlugOrId(action.gameSlug);
    if (!gameId) return { ok: false, message: `Game not found: ${action.gameSlug}` };

    let created = 0;
    let skipped = 0;
    for (const code of action.cards) {
      const exists = await pool.query('SELECT id FROM game_cards WHERE game_id = $1 AND card_code = $2 LIMIT 1', [gameId, code]);
      if (exists.rows.length) {
        skipped++;
        continue;
      }
      const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await pool.query('INSERT INTO game_cards (id, game_id, card_code) VALUES ($1, $2, $3)', [id, gameId, code]);
      created++;
    }

    await logAudit('ai_bulk_add_cards', `AI bulk cards for ${action.gameSlug}: created=${created}, skipped=${skipped}`, reqUser);
    return { ok: true, created, skipped };
  }

  return { ok: false, message: `Unsupported action: ${action.type}` };
}

router.post('/plan', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ message: 'prompt required' });

    let plan = null;
    let source = 'fallback';

    if (AI_API_KEY) {
      try {
        const json = await generatePlanWithGemini(prompt);
        const actions = Array.isArray(json?.actions) ? json.actions : [];
        plan = actions;
        source = 'gemini';
      } catch (err) {
        plan = null;
        source = 'fallback';
      }
    }

    if (!plan) {
      plan = fallbackPlanFromPrompt(prompt);
    }

    const validated = [];
    const rejected = [];
    for (const a of Array.isArray(plan) ? plan : []) {
      const v = validatePlannedAction(a);
      if (v.ok) validated.push(v.value);
      else rejected.push({ action: a, message: v.message });
    }

    await logAudit('ai_plan', `AI plan (${source}): ok=${validated.length}, rejected=${rejected.length}`, req.user);

    res.json({ ok: true, source, actions: validated, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/execute', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
    if (!actions.length) return res.status(400).json({ message: 'actions array required' });

    const validated = [];
    const rejected = [];
    for (const a of actions) {
      const v = validatePlannedAction(a);
      if (v.ok) validated.push(v.value);
      else rejected.push({ action: a, message: v.message });
    }

    if (rejected.length) {
      await logAudit('ai_execute_rejected', `AI execute rejected: rejected=${rejected.length}`, req.user);
      return res.status(400).json({ message: 'Some actions are invalid', rejected });
    }

    const results = [];
    for (const a of validated) {
      try {
        const r = await applyAction(a, req.user);
        results.push({ action: a, ...r });
      } catch (err) {
        results.push({ action: a, ok: false, message: err.message });
      }
    }

    await logAudit('ai_execute', `AI execute: total=${validated.length}`, req.user);

    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
