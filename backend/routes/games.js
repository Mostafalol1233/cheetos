import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import localDb from '../utils/localDb.js';

const router = express.Router();

// Helper to normalize image URL
const normalizeImageUrl = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/uploads/') || v.startsWith('/media/') || v.startsWith('/images/') || v.startsWith('/attached_assets/')) return v;
  if (v.startsWith('/public/')) return v.replace(/^\/public\//, '/images/');
  return v;
};

// Helper to format game response
const formatGame = (game, packages = []) => {
  try {
    if (!game) return null;
    
    // If packages is empty, try to construct it from game legacy fields
    let pkgList = Array.isArray(packages) ? packages : [];
    
    // If we have packagesList in the game object (from local DB), use it
    if (pkgList.length === 0 && Array.isArray(game.packagesList)) {
        pkgList = game.packagesList;
    }
    
    if (pkgList.length === 0 && Array.isArray(game.packages) && game.packages.length > 0) {
       // Construct from legacy
       const prices = Array.isArray(game.packagePrices)
         ? game.packagePrices
         : (Array.isArray(game.package_prices) ? game.package_prices : []);
       const discounts = Array.isArray(game.packageDiscountPrices)
         ? game.packageDiscountPrices
         : (Array.isArray(game.package_discount_prices)
           ? game.package_discount_prices
           : (Array.isArray(game.discountPrices) ? game.discountPrices : []));
       const thumbnails = Array.isArray(game.packageThumbnails)
         ? game.packageThumbnails
         : (Array.isArray(game.package_thumbnails) ? game.package_thumbnails : []);
       
       pkgList = game.packages.map((p, i) => {
         if (typeof p === 'object' && p !== null) return p;
         return {
           id: `pkg_${game.id}_${i}`,
           name: String(p),
           price: Number(prices[i] || 0),
           discount_price: (discounts[i] !== undefined && discounts[i] !== null && discounts[i] !== '') ? Number(discounts[i]) : null,
           image: thumbnails[i] || null
         };
       });
    }

    // Backward compatibility fields
    const legacyPackages = pkgList.map(p => p.name);
    const legacyPrices = pkgList.map(p => Number(p.price));
    const legacyDiscounts = pkgList.map(p => (p.discount_price !== undefined && p.discount_price !== null && p.discount_price !== '') ? Number(p.discount_price) : null);
    const legacyThumbnails = pkgList.map(p => p.image ? normalizeImageUrl(p.image) : null);

    return {
      ...game,
      price: Number(game.price || 0),
      stock: Number(game.stock || 0),
      discountPrice: (game.discountPrice !== undefined && game.discountPrice !== null)
        ? Number(game.discountPrice)
        : (game.discount_price ? Number(game.discount_price) : null),
      isPopular: !!(game.isPopular || game.is_popular),
      showOnMainPage: game.showOnMainPage !== undefined ? !!game.showOnMainPage : (game.show_on_main_page !== undefined ? !!game.show_on_main_page : true),
      displayOrder: game.displayOrder !== undefined ? Number(game.displayOrder) : (game.display_order !== undefined ? Number(game.display_order) : 999),
      image: normalizeImageUrl(game.image),
      image_url: normalizeImageUrl(game.image_url || game.image), // ensure large image is included
      // Legacy arrays
      packages: legacyPackages,
      packagePrices: legacyPrices,
      packageDiscountPrices: legacyDiscounts,
      packageThumbnails: legacyThumbnails,
      // New structure
      packagesList: pkgList.map(p => ({
        id: p.id || `pkg_${Math.random()}`,
        name: p.name || p.amount || '',
        price: Number(p.price || 0),
        discountPrice: (p.discount_price !== undefined && p.discount_price !== null && p.discount_price !== ''
          ? Number(p.discount_price)
          : (p.discountPrice !== undefined && p.discountPrice !== null && p.discountPrice !== '' ? Number(p.discountPrice) : null)),
        image: p.image ? normalizeImageUrl(p.image) : null
      }))
    };
  } catch (error) {
    console.error('Error formatting game:', error);
    // Return a safe minimal object instead of crashing
    return {
      ...game,
      id: game?.id || 'unknown',
      name: game?.name || 'Error loading game',
      price: 0,
      stock: 0,
      image: normalizeImageUrl(game?.image),
      image_url: normalizeImageUrl(game?.image_url || game?.image),
      packagesList: [],
      packages: [],
      packagePrices: [],
      packageDiscountPrices: []
    };
  }
};

// In-memory cache for popular (visible) games
let popularCache = { items: [], ts: 0 };
const POPULAR_TTL_MS = 15000;
function getPopularCache() {
  const now = Date.now();
  if (popularCache.items && popularCache.items.length && (now - popularCache.ts) < POPULAR_TTL_MS) {
    return popularCache.items;
  }
  return null;
}
function setPopularCache(items) {
  popularCache = { items, ts: Date.now() };
}
function invalidatePopularCache() {
  popularCache = { items: [], ts: 0 };
}

// GET /api/games
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      GROUP BY g.id
      ORDER BY g.is_popular DESC, g.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countRes = await pool.query('SELECT COUNT(*) FROM games');
    const total = parseInt(countRes.rows[0].count);

    const items = gamesRes.rows.map(row => {
      const { packages_data, ...game } = row;
      return formatGame(game, packages_data);
    });

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('DB Error, falling back to local DB:', error.message);
    const allGames = localDb.getGames();
    const total = allGames.length;
    const items = allGames
      .slice(offset, offset + limit)
      .map(g => formatGame(g));

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  }
});

// GET /api/games/popular
router.get('/popular', async (req, res) => {
  try {
    const cached = getPopularCache();
    if (cached) {
      return res.json(cached);
    }
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      WHERE g.show_on_main_page = TRUE
      GROUP BY g.id
      ORDER BY g.display_order ASC, g.name ASC
      LIMIT 50
    `);
    
    const items = gamesRes.rows.map(row => {
      const { packages_data, ...game } = row;
      return formatGame(game, packages_data);
    });

    setPopularCache(items);
    res.json(items);
  } catch (error) {
    console.error('DB Error (popular), falling back to local DB:', error.message);
    const allGames = localDb.getGames();
    const visibleGames = allGames.filter(g => (g.showOnMainPage !== undefined ? g.showOnMainPage : (g.show_on_main_page !== undefined ? g.show_on_main_page : true)));
    const sortedGames = visibleGames.sort((a, b) => {
      const orderA = a.displayOrder !== undefined ? a.displayOrder : (a.display_order !== undefined ? a.display_order : 999);
      const orderB = b.displayOrder !== undefined ? b.displayOrder : (b.display_order !== undefined ? b.display_order : 999);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    }).slice(0, 50);
    const items = sortedGames.map(g => formatGame(g));
    setPopularCache(items);
    res.json(items);
  }
});

// GET /api/games/id/:id
router.get('/id/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      WHERE g.id = $1
      GROUP BY g.id
    `, [id]);

    if (gamesRes.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const { packages_data, ...game } = gamesRes.rows[0];
    res.json(formatGame(game, packages_data));
  } catch (error) {
    console.error('DB Error (get by id), falling back to local DB:', error.message);
    const game = localDb.findGame(id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(formatGame(game));
  }
});

// GET /api/games/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      WHERE g.slug = $1
      GROUP BY g.id
    `, [slug]);

    if (gamesRes.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const { packages_data, ...game } = gamesRes.rows[0];
    res.json(formatGame(game, packages_data));
  } catch (error) {
    console.error('DB Error (get by slug), falling back to local DB:', error.message);
    const game = localDb.findGame(slug);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(formatGame(game));
  }
});

// GET /api/games/:id (or slug)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      WHERE g.id = $1 OR g.slug = $1
      GROUP BY g.id
    `, [id]);
    
    if (gamesRes.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const { packages_data, ...game } = gamesRes.rows[0];
    res.json(formatGame(game, packages_data));
  } catch (error) {
    console.error('DB Error (get one), falling back to local DB:', error.message);
    const game = localDb.findGame(id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(formatGame(game));
  }
});

// POST /api/games
router.post('/', authenticateToken, ensureAdmin, async (req, res) => {
  const { 
    name, slug, description, price, currency, image, category, isPopular, stock, discountPrice,
    packagesList, packages, packagePrices, packageDiscountPrices,
    showOnMainPage, displayOrder
  } = req.body;

  // Validate duplicate name
  try {
    const dup = await pool.query('SELECT 1 FROM games WHERE lower(name) = lower($1)', [name]);
    if (dup.rows.length) {
      return res.status(409).json({ message: 'Duplicate game name' });
    }
  } catch {}

  // Validate order number if provided
  if (displayOrder !== undefined) {
    const n = Number(displayOrder);
    if (!Number.isInteger(n) || n < 0) {
      return res.status(400).json({ message: 'Display order must be a positive integer' });
    }
  }

  const gameId = `game_${Date.now()}`;
  const gameSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const isPop = !!isPopular;
  const showMain = showOnMainPage !== undefined ? !!showOnMainPage : false;
  const dispOrder = displayOrder !== undefined ? Number(displayOrder) : 999;

  // Prepare game object for potential local save
  const gameData = {
      id: gameId,
      name,
      slug: gameSlug,
      description: description || '',
      price: Number(price) || 0,
      currency: currency || 'EGP',
      image: image || '',
      category: category || 'other',
      is_popular: isPop,
      isPopular: isPop,
      stock: Number(stock) || 0,
      discount_price: discountPrice ? Number(discountPrice) : null,
      show_on_main_page: showMain,
      showOnMainPage: showMain,
      display_order: dispOrder,
      displayOrder: dispOrder,
      created_at: new Date().toISOString()
  };

  // Prepare packages
  let pkgsToInsert = [];
  if (Array.isArray(packagesList)) {
      pkgsToInsert = packagesList;
  } else if (Array.isArray(packages)) {
      pkgsToInsert = packages.map((p, i) => ({
        id: `pkg_${gameId}_${i}`,
        name: p,
        price: Number(packagePrices?.[i] || 0),
        discount_price: packageDiscountPrices?.[i] ? Number(packageDiscountPrices[i]) : null,
        image: null
      }));
  }
  gameData.packagesList = pkgsToInsert; // Store in new format for local DB

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(`
        INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price, show_on_main_page, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        gameId, name, gameSlug, description || '', Number(price) || 0, currency || 'EGP', 
        image || '', category || 'other', isPop, Number(stock) || 0, 
        discountPrice ? Number(discountPrice) : null, showMain, dispOrder
      ]);

      for (const pkg of pkgsToInsert) {
        if (pkg.name) {
          await client.query(`
            INSERT INTO game_packages (game_id, name, price, discount_price, image)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            gameId, pkg.name, Number(pkg.price || 0), 
            pkg.discountPrice || pkg.discount_price ? Number(pkg.discountPrice || pkg.discount_price) : null,
            pkg.image || null
          ]);
        }
      }

      await client.query('COMMIT');
      await logAudit('create_game', `Created game: ${name} (${gameId})`, req.user);
      
      const created = formatGame(gameData, pkgsToInsert);
      invalidatePopularCache();
      res.status(201).json(created);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('DB Error (create), falling back to local DB:', error.message);
    return res.status(503).json({ message: 'Database unavailable' });
  }
});

// PUT /api/games/:id
router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { 
    name, slug, description, price, currency, image, category, isPopular, stock, discountPrice,
    packagesList, packages, packagePrices, packageDiscountPrices,
    showOnMainPage, displayOrder
  } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if game exists
      const checkRes = await client.query('SELECT * FROM games WHERE id = $1 OR slug = $1', [id]);
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Game not found' });
      }
      const existingGame = checkRes.rows[0];
      const realId = existingGame.id;

      // Duplicate name validation
      if (name) {
        const dup = await client.query('SELECT 1 FROM games WHERE lower(name) = lower($1) AND id <> $2', [name, realId]);
        if (dup.rows.length) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: 'Duplicate game name' });
        }
      }
      // Order validation
      if (displayOrder !== undefined) {
        const n = Number(displayOrder);
        if (!Number.isInteger(n) || n < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Display order must be a positive integer' });
        }
      }

      // Update Game
      await client.query(`
        UPDATE games SET 
          name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          currency = COALESCE($5, currency),
          image = COALESCE($6, image),
          category = COALESCE($7, category),
          is_popular = COALESCE($8, is_popular),
          stock = COALESCE($9, stock),
          discount_price = COALESCE($10, discount_price),
          show_on_main_page = COALESCE($11, show_on_main_page),
          display_order = COALESCE($12, display_order),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
      `, [
        name, slug, description, price !== undefined ? Number(price) : undefined, currency,
        image, category, isPopular !== undefined ? !!isPopular : undefined, 
        stock !== undefined ? Number(stock) : undefined, 
        discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : undefined,
        showOnMainPage !== undefined ? !!showOnMainPage : undefined,
        displayOrder !== undefined ? Number(displayOrder) : undefined,
        realId
      ]);

      // Update Packages if provided
      if (packagesList || packages) {
        await client.query('DELETE FROM game_packages WHERE game_id = $1', [realId]);
        
        let pkgsToInsert = [];
        if (Array.isArray(packagesList)) {
          pkgsToInsert = packagesList;
        } else if (Array.isArray(packages)) {
          pkgsToInsert = packages.map((p, i) => ({
            name: p,
            price: Number(packagePrices?.[i] || 0),
            discount_price: packageDiscountPrices?.[i] ? Number(packageDiscountPrices[i]) : null,
            image: null
          }));
        }

        for (const pkg of pkgsToInsert) {
          if (pkg.name) {
            await client.query(`
              INSERT INTO game_packages (game_id, name, price, discount_price, image)
              VALUES ($1, $2, $3, $4, $5)
            `, [
              realId, pkg.name, Number(pkg.price || 0), 
              pkg.discountPrice || pkg.discount_price ? Number(pkg.discountPrice || pkg.discount_price) : null,
              pkg.image || null
            ]);
          }
        }
      }

      await client.query('COMMIT');
      await logAudit('update_game', `Updated game: ${name || existingGame.name} (${realId})`, req.user);

      // Fetch updated
      const finalRes = await pool.query(`
        SELECT g.*, 
               COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
        FROM games g
        LEFT JOIN game_packages gp ON g.id = gp.game_id
        WHERE g.id = $1
        GROUP BY g.id
      `, [realId]);
      
      const { packages_data, ...game } = finalRes.rows[0];
      invalidatePopularCache();
      res.json(formatGame(game, packages_data));

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('DB Error (update), falling back to local DB:', error.message);
    return res.status(503).json({ message: 'Database unavailable' });
  }
});

// DELETE /api/games/:id
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const resDb = await pool.query('UPDATE games SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 OR slug = $1 RETURNING id', [id]);
    if (resDb.rowCount === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    await logAudit('delete_game_soft', `Soft-deleted game: ${id}`, req.user);
    invalidatePopularCache();
    res.json({ message: 'Game marked as deleted' });
  } catch (error) {
    console.error('DB Error (delete), falling back to local DB:', error.message);
    const g = localDb.findGame(id);
    if (!g) return res.status(404).json({ message: 'Game not found' });
    localDb.updateGame(g.id, { deleted: true });
    await logAudit('delete_game_soft', `Soft-deleted game (local): ${id}`, req.user);
    invalidatePopularCache();
    res.json({ message: 'Game marked as deleted' });
  }
});

// Support legacy routes if needed (e.g. /category/:cat)
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      WHERE LOWER(g.category) = LOWER($1)
      GROUP BY g.id
    `, [category]);
    
    const items = gamesRes.rows.map(row => {
      const { packages_data, ...game } = row;
      return formatGame(game, packages_data);
    });

    res.json(items);
  } catch (error) {
    console.error('DB Error (category), falling back to local DB:', error.message);
    const allGames = localDb.getGames();
    const filtered = allGames.filter(g => (g.category || '').toLowerCase() === category.toLowerCase());
    res.json(filtered.map(g => formatGame(g)));
  }
});

// GET /api/games/:id/packages
router.get('/:id/packages', async (req, res) => {
  const { id } = req.params;
  try {
    const resDb = await pool.query('SELECT * FROM game_packages WHERE game_id = $1 ORDER BY price ASC', [id]);

    if (resDb.rows.length > 0) {
      const items = resDb.rows.map(p => ({
        ...p,
        amount: p.name,
        price: Number(p.price),
        discountPrice: (p.discount_price !== undefined && p.discount_price !== null && p.discount_price !== '') ? Number(p.discount_price) : null,
        value: p.value != null ? Number(p.value) : null,
        duration: p.duration || null,
        description: p.description || null
      }));
      return res.json(items);
    }

    // If there are no package rows yet, fall back to packages stored on the games row (seeded JSON)
    const gameRes = await pool.query('SELECT packages, package_prices, package_discount_prices, package_thumbnails FROM games WHERE id = $1 OR slug = $1 LIMIT 1', [id]);
    const g = gameRes.rows?.[0];
    if (g) {
      const packages = Array.isArray(g.packages) ? g.packages : [];
      const prices = Array.isArray(g.package_prices) ? g.package_prices : [];
      const discounts = Array.isArray(g.package_discount_prices) ? g.package_discount_prices : [];
      const thumbnails = Array.isArray(g.package_thumbnails) ? g.package_thumbnails : [];

      const items = packages.map((name, i) => ({
        id: `pkg_${id}_${i}`,
        amount: String(name ?? ''),
        price: Number(prices[i] ?? 0),
        discountPrice: (discounts[i] !== undefined && discounts[i] !== null && discounts[i] !== '') ? Number(discounts[i]) : null,
        image: thumbnails[i] ?? null,
        value: null,
        duration: null,
        description: null
      })).filter((p) => p.amount);

      return res.json(items);
    }

    res.json([]);
  } catch (error) {
    console.error('DB Error (packages), falling back to local DB:', error.message);
    const game = localDb.findGame(id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    const formatted = formatGame(game);
    const items = formatted.packagesList.map(p => ({
      ...p,
      amount: p.name,
      discountPrice: p.discountPrice,
      price: p.price
    }));
    res.json(items);
  }
});

// PUT /api/games/:id/packages
router.put('/:id/packages', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { packages } = req.body; 

  try {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const gameCheck = await client.query('SELECT id FROM games WHERE id = $1', [id]);
        if (gameCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Game not found' });
        }

        await client.query('DELETE FROM game_packages WHERE game_id = $1', [id]);
        
        const pkgsArr = Array.isArray(packages) ? packages : [];
        const legacyPackages = [];
        const legacyPrices = [];
        const legacyDiscounts = [];
        const legacyThumbnails = [];

        for (const pkg of pkgsArr) {
          const name = pkg.name || pkg.amount;
          if (!name) continue;
          const price = Number(pkg.price || 0);
          const discount = pkg.discountPrice != null && pkg.discountPrice !== '' ? Number(pkg.discountPrice) : null;
          const image = pkg.image || null;
          const value = pkg.value != null && pkg.value !== '' ? Number(pkg.value) : null;
          const duration = pkg.duration ? String(pkg.duration).slice(0, 50) : null;
          const description = pkg.description ? String(pkg.description).slice(0, 500) : null;

          // Server-side validation
          if (price < 0 || (value != null && value < 0)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Price and value must be non-negative' });
          }
          if (duration && duration.length > 50) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Duration too long' });
          }

          legacyPackages.push(String(name));
          legacyPrices.push(price);
          legacyDiscounts.push(Number.isFinite(discount) ? discount : null);
          legacyThumbnails.push(image);

          await client.query(`
              INSERT INTO game_packages (game_id, name, price, discount_price, image, value, duration, description)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
              id, name, price,
              Number.isFinite(discount) ? discount : null,
              image,
              Number.isFinite(value) ? value : null,
              duration,
              description
          ]);
        }

        // Also persist packages onto the games row (so website/game page can render without joining game_packages)
        await client.query(
          `UPDATE games
           SET packages = $2::jsonb,
               package_prices = $3::jsonb,
               package_discount_prices = $4::jsonb,
               package_thumbnails = $5::jsonb,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [id, JSON.stringify(legacyPackages), JSON.stringify(legacyPrices), JSON.stringify(legacyDiscounts), JSON.stringify(legacyThumbnails)]
        );

        await client.query('COMMIT');
        
        const resDb = await pool.query('SELECT * FROM game_packages WHERE game_id = $1 ORDER BY price ASC', [id]);
        const items = resDb.rows.map(p => ({
        ...p,
        amount: p.name,
        price: Number(p.price),
        discountPrice: (p.discount_price !== undefined && p.discount_price !== null && p.discount_price !== '') ? Number(p.discount_price) : null,
        value: p.value != null ? Number(p.value) : null,
        duration: p.duration || null,
        description: p.description || null
        }));
        
        await logAudit('update_packages', `Updated packages for game: ${id}`, req.user);
        res.json(items);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
  } catch (error) {
    console.error('DB Error (update packages), falling back to local DB:', error.message);
    try {
      const pkgsArr = Array.isArray(packages) ? packages : [];
      const normalized = pkgsArr.map((pkg, i) => {
        const name = pkg.name || pkg.amount || '';
        if (!name) return null;
        const price = Number(pkg.price || 0);
        const discount = pkg.discountPrice != null && pkg.discountPrice !== '' ? Number(pkg.discountPrice) : null;
        const image = pkg.image || null;
        const value = pkg.value != null && pkg.value !== '' ? Number(pkg.value) : null;
        const duration = pkg.duration ? String(pkg.duration).slice(0, 50) : null;
        const description = pkg.description ? String(pkg.description).slice(0, 500) : null;
        return {
          id: `pkg_${id}_${i}`,
          name,
          price,
          discountPrice: Number.isFinite(discount) ? discount : null,
          discount_price: Number.isFinite(discount) ? discount : null,
          image,
          value: Number.isFinite(value) ? value : null,
          duration,
          description
        };
      }).filter(Boolean);

      const legacyPackages = normalized.map(p => String(p.name));
      const legacyPrices = normalized.map(p => Number(p.price || 0));
      const legacyDiscounts = normalized.map(p => (p.discountPrice != null ? Number(p.discountPrice) : null));
      const legacyThumbnails = normalized.map(p => p.image || null);

      const updated = localDb.updateGame(id, {
        packagesList: normalized,
        packages: legacyPackages,
        package_prices: legacyPrices,
        package_discount_prices: legacyDiscounts,
        package_thumbnails: legacyThumbnails
      });
      if (!updated) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const items = normalized.map(p => ({
        amount: p.name,
        price: Number(p.price),
        discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
        image: p.image || null,
        value: p.value != null ? Number(p.value) : null,
        duration: p.duration || null,
        description: p.description || null
      }));
      return res.json(items);
    } catch (err2) {
      console.error('Local DB fallback failed:', err2.message);
      return res.status(500).json({ message: 'Failed to update packages' });
    }
  }
});

// PUT /api/games/:id/image-url
router.put('/:id/image-url', authenticateToken, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body;
  if (!image_url || typeof image_url !== 'string') {
    return res.status(400).json({ message: 'image_url (string) is required' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if game exists
      const checkRes = await client.query('SELECT id FROM games WHERE id = $1 OR slug = $1', [id]);
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Game not found' });
      }
      const gameId = checkRes.rows[0].id;

      // Update only image_url
      await client.query(
        'UPDATE games SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [image_url, gameId]
      );

      await client.query('COMMIT');
      await logAudit('update_game_image_url', `Updated game image_url for ${gameId}`, req.user);

      res.json({ id: gameId, image_url });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('DB Error (update image_url), falling back to local DB:', error.message);
    return res.status(503).json({ message: 'Database unavailable' });
  }
});

// ===================== ADMIN: ARRANGEMENT =====================
router.get('/admin/arrangement', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const filter = (req.query.filter || 'active').toString();
    let where = '';
    if (filter === 'active') where = 'WHERE COALESCE(deleted, FALSE) = FALSE';
    if (filter === 'deleted') where = 'WHERE COALESCE(deleted, FALSE) = TRUE';
    const rows = await pool.query(`
      SELECT id, name, slug, show_on_main_page, display_order, deleted, updated_at
      FROM games
      ${where}
      ORDER BY display_order ASC, name ASC
    `);
    res.json(rows.rows || []);
  } catch (err) {
    console.error('Arrangement fetch error:', err);
    try {
      const all = localDb.getGames();
      const filter = (req.query.filter || 'active').toString();
      let items = all;
      if (filter === 'active') items = all.filter(g => !g.deleted);
      if (filter === 'deleted') items = all.filter(g => !!g.deleted);
      items = items.sort((a, b) => {
        const ao = Number(a.displayOrder ?? a.display_order ?? 999);
        const bo = Number(b.displayOrder ?? b.display_order ?? 999);
        if (ao !== bo) return ao - bo;
        return String(a.name).localeCompare(String(b.name));
      });
      res.json(items.map(g => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        show_on_main_page: !!(g.showOnMainPage ?? g.show_on_main_page ?? false),
        display_order: Number(g.displayOrder ?? g.display_order ?? 999),
        deleted: !!g.deleted,
        updated_at: g.updated_at || new Date().toISOString()
      })));
    } catch {
      res.json([]);
    }
  }
});

router.put('/admin/arrangement/bulk', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    if (!updates.length) return res.status(400).json({ message: 'updates[] required' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const u of updates) {
        const id = u.id;
        if (!id) continue;
        let visible = undefined;
        let order = undefined;
        if (u.showOnMainPage !== undefined) visible = !!u.showOnMainPage;
        if (u.displayOrder !== undefined) {
          const n = Number(u.displayOrder);
          if (!Number.isInteger(n) || n < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Invalid displayOrder for ${id}` });
          }
          order = n;
        }
        await client.query(`
          UPDATE games
          SET show_on_main_page = COALESCE($2, show_on_main_page),
              display_order = COALESCE($3, display_order),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [id, visible, order]);
      }
      await client.query('COMMIT');
      await logAudit('bulk_arrangement', `Bulk arrangement updates: ${updates.length}`, req.user);
      invalidatePopularCache();
      res.json({ ok: true, updated: updates.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Arrangement bulk error:', err);
    return res.status(503).json({ message: 'Database unavailable' });
  }
});

export default router;
