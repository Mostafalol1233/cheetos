import pool from '../db.js';

function normalizeKey(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9\- ]+/g, '')
    .replace(/\s/g, '-');
}

function extractValueFromAmount(amount) {
  const s = String(amount || '').trim();
  const normalized = s
    .replace(/[\s,]+/g, '')
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0));
  const digits = (normalized.match(/[0-9]+/) || [''])[0];
  return digits ? Number(digits) : 1;
}

function toNumberPrice(raw) {
  const s = String(raw || '').trim();
  if (!s) return 0;
  // Accept formats like: 102l.e / 400.le / 55 / 225
  const cleaned = s.replace(/[^0-9.]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

async function findGameIdByNameOrSlug(nameCandidates) {
  const candidates = nameCandidates
    .map((x) => String(x || '').trim())
    .filter(Boolean);

  // Try exact-ish matches via ILIKE
  for (const c of candidates) {
    const res = await pool.query(
      `SELECT id, name, slug FROM games
       WHERE LOWER(name) = LOWER($1)
          OR LOWER(slug) = LOWER($1)
       LIMIT 1`,
      [c]
    );
    if (res.rows?.[0]?.id) return res.rows[0];
  }

  // Try fuzzy slug normalization
  for (const c of candidates) {
    const slug = normalizeKey(c);
    const res = await pool.query(
      `SELECT id, name, slug FROM games
       WHERE LOWER(slug) = LOWER($1)
       LIMIT 1`,
      [slug]
    );
    if (res.rows?.[0]?.id) return res.rows[0];
  }

  // Try partial name match
  for (const c of candidates) {
    const res = await pool.query(
      `SELECT id, name, slug FROM games
       WHERE name ILIKE $1
          OR slug ILIKE $1
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1`,
      [`%${c}%`]
    );
    if (res.rows?.[0]?.id) return res.rows[0];
  }

  return null;
}

async function upsertPackagesForGame({ gameId, packages }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gameCheck = await client.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (!gameCheck.rows.length) {
      throw new Error(`Game not found: ${gameId}`);
    }

    await client.query('DELETE FROM game_packages WHERE game_id = $1', [gameId]);

    const legacyPackages = [];
    const legacyPrices = [];
    const legacyDiscounts = [];
    const legacyThumbnails = [];

    for (const p of packages) {
      const amount = String(p.amount || '').trim();
      const price = toNumberPrice(p.price);
      const discountPrice = p.discountPrice == null || p.discountPrice === '' ? null : toNumberPrice(p.discountPrice);
      const image = p.image || null;
      const value = extractValueFromAmount(amount);

      if (!amount) continue;

      if (price < 0 || !Number.isFinite(price) || value < 0 || !Number.isFinite(value)) {
        throw new Error(`Invalid package data for game ${gameId}: amount=${amount} price=${p.price}`);
      }

      await client.query(
        `INSERT INTO game_packages (game_id, name, price, discount_price, image)
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, amount, price, discountPrice, image]
      );

      legacyPackages.push(amount);
      legacyPrices.push(price);
      legacyDiscounts.push(discountPrice);
      legacyThumbnails.push(image);
    }

    await client.query(
      `UPDATE games
       SET packages = $2::jsonb,
           package_prices = $3::jsonb,
           package_discount_prices = $4::jsonb,
           package_thumbnails = $5::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [gameId, JSON.stringify(legacyPackages), JSON.stringify(legacyPrices), JSON.stringify(legacyDiscounts), JSON.stringify(legacyThumbnails)]
    );

    await client.query('COMMIT');

    return {
      ok: true,
      gameId,
      count: legacyPackages.length,
      packages: legacyPackages,
      prices: legacyPrices,
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const seeds = [
    {
      gameNames: ['Crossfire', 'CrossFire'],
      packages: [
        { amount: '5000 ZP', price: '102' },
        { amount: '10000 ZP', price: '205' },
        { amount: '20000 ZP', price: '400' },
        { amount: '50000 ZP', price: '965' },
        { amount: '100000 ZP', price: '1990' },
      ],
    },
    {
      gameNames: ['Roblox'],
      packages: [
        { amount: '80 Robux', price: '75' },
        { amount: '120 Robux', price: '115' },
        { amount: '160 Robux', price: '150' },
        { amount: '240 Robux', price: '225' },
        { amount: '400 Robux', price: '340' },
        { amount: '1000 Robux', price: '580' },
        { amount: '2000 Robux', price: '1160' },
      ],
    },
    {
      gameNames: ['PUBG', 'PUBG Mobile', 'pubg-mobile'],
      packages: [
        { amount: '60 UC', price: '55' },
        { amount: '325 UC', price: '225' },
        { amount: '660 UC', price: '450' },
        { amount: '1800 UC', price: '1150' },
        { amount: '3850 UC', price: '2300' },
        { amount: '8100 UC', price: '4300' },
      ],
    },
    {
      gameNames: ['Yalla ludo', 'Yalla Ludo', 'yalla-ludo'],
      packages: [
        { amount: '830 Jewels', price: '135' },
        { amount: '2333 Jewels', price: '280' },
        { amount: '5150 Jewels', price: '560' },
        { amount: '10400 Jewels', price: '1120' },
        { amount: '13000 Jewels', price: '1450' },
        { amount: '27800 Jewels', price: '2750' },
        { amount: '56000 Jewels', price: '5250' },
      ],
    },
  ];

  const results = [];

  for (const s of seeds) {
    const game = await findGameIdByNameOrSlug(s.gameNames);
    if (!game?.id) {
      results.push({ ok: false, gameNames: s.gameNames, error: 'Game not found in DB' });
      continue;
    }

    const r = await upsertPackagesForGame({ gameId: game.id, packages: s.packages });
    results.push({ ...r, game: { id: game.id, name: game.name, slug: game.slug } });
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error('seed-missing-packages-db failed:', err);
  process.exit(1);
});
