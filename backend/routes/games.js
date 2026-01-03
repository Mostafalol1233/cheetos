import express from 'express';
import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gamesFilePath = path.join(__dirname, '..', 'data', 'games.json');

import { logAudit } from '../utils/audit.js';

// Helper functions for JSON file operations
const normalizeImageUrl = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/uploads/') || v.startsWith('/media/') || v.startsWith('/images/') || v.startsWith('/attached_assets/')) return v;
  if (v.startsWith('/public/')) return v.replace(/^\/public\//, '/images/');
  return v;
};

const coerceJsonArray = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    if (s.startsWith('[') && s.endsWith(']')) {
      try { return JSON.parse(s); } catch { return [s]; }
    }
    if (s.includes(',')) return s.split(',').map(t => t.trim()).filter(Boolean);
    return [s];
  }
  return [];
};

const readGamesFile = () => {
  try {
    if (!fs.existsSync(gamesFilePath)) return [];
    const data = fs.readFileSync(gamesFilePath, 'utf8');
    const games = JSON.parse(data) || [];
    return Array.isArray(games) ? games : [];
  } catch (error) {
    console.error('Error reading games.json:', error);
    return [];
  }
};

const writeGamesFile = (games) => {
  try {
    fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing games.json:', error);
    return false;
  }
};

const findGame = (games, idOrSlug) => {
  return games.find(g => 
    String(g.id) === idOrSlug || 
    String(g.slug) === idOrSlug ||
    String(g.slug).replace(/-/g, '').toLowerCase() === String(idOrSlug).replace(/-/g, '').toLowerCase()
  );
};



// GET /api/games - Get all games with pagination
router.get('/', async (req, res) => {
  try {
    const games = readGamesFile();
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedGames = games.slice(startIndex, endIndex).map(g => ({
      ...g,
      image: normalizeImageUrl(g.image),
      packages: coerceJsonArray(g.packages),
      packagePrices: coerceJsonArray(g.packagePrices),
      packageDiscountPrices: coerceJsonArray(g.packageDiscountPrices)
    }));

    res.json({
      items: paginatedGames,
      total: games.length,
      page,
      limit,
      totalPages: Math.ceil(games.length / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/popular - Get popular games
router.get('/popular', async (req, res) => {
  try {
    const games = readGamesFile();
    const popularGames = games
      .filter(g => g.isPopular || g.is_popular)
      .slice(0, 10)
      .map(g => ({
        ...g,
        image: normalizeImageUrl(g.image)
      }));
    res.json(popularGames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/hot-deals - Get hot deals
router.get('/hot-deals', async (req, res) => {
  try {
    const games = readGamesFile();
    const hotDeals = games
      .filter(g => g.hot_deal === true)
      .map(g => ({
        ...g,
        image: normalizeImageUrl(g.image)
      }));
    res.json(hotDeals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/category/:category - Get games by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const games = readGamesFile();
    const filteredGames = games
      .filter(g => (g.category || '').toLowerCase() === category.toLowerCase())
      .map(g => ({
        ...g,
        image: normalizeImageUrl(g.image)
      }));
    res.json(filteredGames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/id/:id - Get single game by ID (Compatibility)
router.get('/id/:id', async (req, res) => {
  try {
    const games = readGamesFile();
    const game = findGame(games, req.params.id);
    
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    res.json({
      ...game,
      image: normalizeImageUrl(game.image),
      packages: coerceJsonArray(game.packages),
      packagePrices: coerceJsonArray(game.packagePrices),
      packageDiscountPrices: coerceJsonArray(game.packageDiscountPrices)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/slug/:slug - Get single game by Slug (Compatibility)
router.get('/slug/:slug', async (req, res) => {
  try {
    const games = readGamesFile();
    const game = findGame(games, req.params.slug);
    
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    res.json({
      ...game,
      image: normalizeImageUrl(game.image),
      packages: coerceJsonArray(game.packages),
      packagePrices: coerceJsonArray(game.packagePrices),
      packageDiscountPrices: coerceJsonArray(game.packageDiscountPrices)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/:id - Get single game (by ID or Slug)
router.get('/:id', async (req, res) => {
  try {
    const games = readGamesFile();
    const game = findGame(games, req.params.id);
    
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    res.json({
      ...game,
      image: normalizeImageUrl(game.image),
      packages: coerceJsonArray(game.packages),
      packagePrices: coerceJsonArray(game.packagePrices),
      packageDiscountPrices: coerceJsonArray(game.packageDiscountPrices)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/games - Create new game
router.post('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { name, slug, description, price, currency, image, category, isPopular, stock, packages, packagePrices, discountPrice, packageDiscountPrices } = req.body;
    
    const newGame = {
      id: `game_${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || '',
      price: Number(price) || 0,
      currency: currency || 'EGP',
      image: image || '',
      category: category || 'other',
      isPopular: !!isPopular,
      stock: Number(stock) || 0,
      packages: packages || [],
      packagePrices: packagePrices || [],
      discountPrice: discountPrice ? Number(discountPrice) : null,
      packageDiscountPrices: packageDiscountPrices || [],
      created_at: new Date().toISOString()
    };

    // Update JSON
    const games = readGamesFile();
    games.push(newGame);
    writeGamesFile(games);

    // Update DB (Best effort)
    try {
      await pool.query(
        `INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, packages, package_prices, discount_price, package_discount_prices)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [newGame.id, newGame.name, newGame.slug, newGame.description, newGame.price, newGame.currency, newGame.image, newGame.category, newGame.isPopular, newGame.stock, JSON.stringify(newGame.packages), JSON.stringify(newGame.packagePrices), newGame.discountPrice, JSON.stringify(newGame.packageDiscountPrices)]
      );
      await logAudit('create_game', `Created game: ${newGame.name} (${newGame.id})`, req.user);
    } catch (dbError) {
      console.error('Failed to sync to DB:', dbError);
    }

    res.status(201).json(newGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/games/:id - Update game
router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const games = readGamesFile();
    const index = games.findIndex(g => g.id === id || g.slug === id);

    if (index === -1) return res.status(404).json({ message: 'Game not found' });

    const existingGame = games[index];
    const updatedGame = { ...existingGame, ...updates, updated_at: new Date().toISOString() };
    
    // Ensure numeric fields are numbers
    if (updates.price !== undefined) updatedGame.price = Number(updates.price);
    if (updates.stock !== undefined) updatedGame.stock = Number(updates.stock);
    if (updates.discountPrice !== undefined) updatedGame.discountPrice = updates.discountPrice ? Number(updates.discountPrice) : null;

    games[index] = updatedGame;
    writeGamesFile(games);

    // Update DB
    try {
      await pool.query(
        `UPDATE games SET 
         name = $1, slug = $2, description = $3, price = $4, currency = $5, image = $6, category = $7, is_popular = $8, stock = $9, packages = $10, package_prices = $11, discount_price = $12, package_discount_prices = $13, updated_at = CURRENT_TIMESTAMP
         WHERE id = $14`,
        [updatedGame.name, updatedGame.slug, updatedGame.description, updatedGame.price, updatedGame.currency, updatedGame.image, updatedGame.category, updatedGame.isPopular, updatedGame.stock, JSON.stringify(updatedGame.packages), JSON.stringify(updatedGame.packagePrices), updatedGame.discountPrice, JSON.stringify(updatedGame.packageDiscountPrices), existingGame.id]
      );
      await logAudit('update_game', `Updated game: ${updatedGame.name} (${existingGame.id})`, req.user);
    } catch (dbError) {
      console.error('Failed to sync to DB:', dbError);
    }

    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/games/:id - Delete game
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const games = readGamesFile();
    const newGames = games.filter(g => g.id !== id && g.slug !== id);

    if (games.length === newGames.length) return res.status(404).json({ message: 'Game not found' });

    writeGamesFile(newGames);

    // Update DB
    try {
      // Try to delete by ID first, then slug
      await pool.query('DELETE FROM games WHERE id = $1 OR slug = $1', [id]);
      await logAudit('delete_game', `Deleted game: ${id}`, req.user);
    } catch (dbError) {
      console.error('Failed to sync to DB:', dbError);
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/games/:id/image-url - Update game image URL
router.put('/:id/image-url', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const raw = (req.body && (req.body.image_url ?? req.body.imageUrl ?? req.body.url)) ?? null;
    const imageUrl = raw ? normalizeImageUrl(String(raw).trim()) : null;
    
    if (!imageUrl) return res.status(400).json({ message: 'image_url required' });

    const games = readGamesFile();
    const index = games.findIndex(g => g.id === id || g.slug === id);

    if (index === -1) return res.status(404).json({ message: 'Game not found' });

    const existingGame = games[index];
    const updatedGame = { 
      ...existingGame, 
      image: imageUrl, 
      image_url: imageUrl, 
      updated_at: new Date().toISOString() 
    };
    
    games[index] = updatedGame;
    writeGamesFile(games);

    try {
      await pool.query(
        'UPDATE games SET image = $1, image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR slug = $2',
        [imageUrl, id]
      );
    } catch (dbError) {
      console.error('Failed to sync to DB:', dbError);
    }

    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/games/:id/packages - Get packages for a game
router.get('/:id/packages', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const games = readGamesFile();
    const game = findGame(games, id);

    if (!game) return res.status(404).json({ message: 'Game not found' });

    const packages = coerceJsonArray(game.packages);
    const prices = coerceJsonArray(game.packagePrices);
    const discountPrices = coerceJsonArray(game.packageDiscountPrices);
    const thumbnails = coerceJsonArray(game.packageThumbnails || game.package_thumbnails);

    const packageObjects = packages.map((pkg, index) => {
      if (typeof pkg === 'object' && pkg !== null && pkg.amount) {
        return pkg;
      }
      return {
        amount: String(pkg || ''),
        price: Number(prices[index] || 0),
        discountPrice: discountPrices[index] ? Number(discountPrices[index]) : null,
        image: thumbnails[index] ? String(thumbnails[index]) : null
      };
    });

    res.json(packageObjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/games/:id/packages - Update packages for a game
router.put('/:id/packages', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let { packages } = req.body;
    
    const legacyPrices = Array.isArray(req.body.packagePrices) ? req.body.packagePrices : Array.isArray(req.body.prices) ? req.body.prices : [];
    const legacyDiscounts = Array.isArray(req.body.packageDiscountPrices) ? req.body.packageDiscountPrices : Array.isArray(req.body.discountPrices) ? req.body.discountPrices : [];
    const legacyThumbs = Array.isArray(req.body.packageThumbnails) ? req.body.packageThumbnails : Array.isArray(req.body.thumbnails) ? req.body.thumbnails : [];

    if (!Array.isArray(packages)) {
      if (Array.isArray(req.body.amounts)) {
        packages = req.body.amounts;
      } else if (legacyPrices.length || legacyDiscounts.length || legacyThumbs.length) {
        const len = Math.max(legacyPrices.length, legacyDiscounts.length, legacyThumbs.length);
        packages = new Array(len).fill('').map((_, i) => `package_${i + 1}`);
      } else {
        return res.status(400).json({ message: 'Packages must be an array' });
      }
    }

    const sanitized = packages.map((p, i) => {
      if (typeof p === 'string') {
        return { 
          amount: String(p || '').trim(), 
          price: Number(legacyPrices[i] ?? 0), 
          discountPrice: legacyDiscounts[i] != null ? Number(legacyDiscounts[i]) : null,
          image: legacyThumbs[i] ? String(legacyThumbs[i]).trim() : null
        };
      }
      return { 
        amount: String((p && p.amount) ? p.amount : '').trim(), 
        price: Number((p && p.price) ? p.price : (legacyPrices[i] ?? 0)), 
        discountPrice: (p && p.discountPrice !== undefined && p.discountPrice !== null) ? Number(p.discountPrice) : (legacyDiscounts[i] != null ? Number(legacyDiscounts[i]) : null),
        image: (p && p.image) ? String(p.image).trim() : (legacyThumbs[i] ? String(legacyThumbs[i]).trim() : null)
      };
    });

    // Validate
    for (const pkg of sanitized) {
      if (!pkg.amount) pkg.amount = 'package';
      if (!Number.isFinite(pkg.price) || pkg.price < 0) pkg.price = 0;
      if (pkg.discountPrice !== null && (!Number.isFinite(pkg.discountPrice) || pkg.discountPrice < 0)) pkg.discountPrice = null;
    }

    const games = readGamesFile();
    const index = games.findIndex(g => g.id === id || g.slug === id);

    if (index === -1) return res.status(404).json({ message: 'Game not found' });

    const existingGame = games[index];
    const amounts = sanitized.map(p => p.amount);
    const prices = sanitized.map(p => p.price);
    const discountPrices = sanitized.map(p => p.discountPrice);
    const thumbnails = sanitized.map(p => (p.image ? normalizeImageUrl(p.image) : null));

    const updatedGame = {
      ...existingGame,
      packages: amounts,
      packagePrices: prices,
      packageDiscountPrices: discountPrices,
      packageThumbnails: thumbnails,
      updated_at: new Date().toISOString()
    };

    games[index] = updatedGame;
    writeGamesFile(games);

    try {
      await pool.query(
        'UPDATE games SET packages = $1::jsonb, package_prices = $2::jsonb, package_discount_prices = $3::jsonb, package_thumbnails = $4::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $5 OR slug = $5',
        [JSON.stringify(amounts), JSON.stringify(prices), JSON.stringify(discountPrices), JSON.stringify(thumbnails), id]
      );
    } catch (dbError) {
      console.error('Failed to sync to DB:', dbError);
    }

    res.json({ message: 'Packages updated successfully', packages: sanitized });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
