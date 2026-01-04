import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Helper to read games from JSON fallback
const readGamesFile = () => {
  try {
    const filePath = path.join(__dirname, '../data/games.json');
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading games.json:', error);
    return [];
  }
};

// Helper to format game response
const formatGame = (game, packages = []) => {
  // If packages is empty, try to construct it from game legacy fields
  let pkgList = Array.isArray(packages) ? packages : [];
  
  if (pkgList.length === 0 && Array.isArray(game.packages) && game.packages.length > 0) {
     // Construct from legacy
     const prices = Array.isArray(game.packagePrices) ? game.packagePrices : [];
     const discounts = Array.isArray(game.packageDiscountPrices) ? game.packageDiscountPrices : [];
     const thumbnails = Array.isArray(game.packageThumbnails) ? game.packageThumbnails : []; // Handle both cases
     
     pkgList = game.packages.map((p, i) => {
       if (typeof p === 'object' && p !== null) return p;
       return {
         id: `pkg_${game.id}_${i}`,
         name: String(p),
         price: Number(prices[i] || 0),
         discount_price: discounts[i] ? Number(discounts[i]) : null,
         image: thumbnails[i] || null
       };
     });
  }

  // Backward compatibility fields
  const legacyPackages = pkgList.map(p => p.name);
  const legacyPrices = pkgList.map(p => Number(p.price));
  const legacyDiscounts = pkgList.map(p => p.discount_price ? Number(p.discount_price) : null);
  const legacyThumbnails = pkgList.map(p => p.image ? normalizeImageUrl(p.image) : null);

  return {
    ...game,
    price: Number(game.price),
    stock: Number(game.stock),
    discountPrice: game.discount_price ? Number(game.discount_price) : null,
    isPopular: !!game.isPopular || !!game.is_popular,
    image: normalizeImageUrl(game.image),
    // Legacy arrays
    packages: legacyPackages,
    packagePrices: legacyPrices,
    packageDiscountPrices: legacyDiscounts,
    packageThumbnails: legacyThumbnails,
    // New structure
    packagesList: pkgList.map(p => ({
      id: p.id || `pkg_${Math.random()}`,
      name: p.name,
      price: Number(p.price),
      discountPrice: p.discount_price ? Number(p.discount_price) : null,
      image: p.image ? normalizeImageUrl(p.image) : null
    }))
  };
};

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
    console.error('DB Error, falling back to JSON:', error.message);
    // Fallback to JSON
    const allGames = readGamesFile();
    const total = allGames.length;
    const items = allGames
      .slice(offset, offset + limit)
      .map(g => formatGame(g)); // formatGame will reconstruct packages from legacy fields

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
    const gamesRes = await pool.query(`
      SELECT g.*, 
             COALESCE(json_agg(gp ORDER BY gp.price) FILTER (WHERE gp.id IS NOT NULL), '[]') as packages_data
      FROM games g
      LEFT JOIN game_packages gp ON g.id = gp.game_id
      WHERE g.is_popular = TRUE
      GROUP BY g.id
      LIMIT 10
    `);
    
    const items = gamesRes.rows.map(row => {
      const { packages_data, ...game } = row;
      return formatGame(game, packages_data);
    });

    res.json(items);
  } catch (error) {
    console.error('DB Error (popular), falling back to JSON:', error.message);
    const allGames = readGamesFile();
    const popular = allGames.filter(g => g.isPopular || g.is_popular).slice(0, 10);
    res.json(popular.map(g => formatGame(g)));
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
      // Try JSON before 404? Or maybe DB connection is fine but game not found.
      // If DB connection is fine (no error thrown), then it's a 404.
      // But if DB connection failed, we land in catch block.
      return res.status(404).json({ message: 'Game not found' });
    }

    const { packages_data, ...game } = gamesRes.rows[0];
    res.json(formatGame(game, packages_data));
  } catch (error) {
    console.error('DB Error (get one), falling back to JSON:', error.message);
    const allGames = readGamesFile();
    const game = allGames.find(g => g.id === id || g.slug === id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(formatGame(game));
  }
});

// POST /api/games
router.post('/', authenticateToken, ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { 
      name, slug, description, price, currency, image, category, isPopular, stock, discountPrice,
      packagesList, packages, packagePrices, packageDiscountPrices // accept both new and old format
    } = req.body;

    const gameId = `game_${Date.now()}`;
    const gameSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const isPop = !!isPopular;

    await client.query(`
      INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      gameId, name, gameSlug, description || '', Number(price) || 0, currency || 'EGP', 
      image || '', category || 'other', isPop, Number(stock) || 0, discountPrice ? Number(discountPrice) : null
    ]);

    // Handle packages
    // If packagesList (new format) is provided, use it.
    // Otherwise fallback to legacy arrays.
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
          gameId, pkg.name, Number(pkg.price || 0), 
          pkg.discountPrice || pkg.discount_price ? Number(pkg.discountPrice || pkg.discount_price) : null,
          pkg.image || null
        ]);
      }
    }

    await client.query('COMMIT');
    await logAudit('create_game', `Created game: ${name} (${gameId})`, req.user);

    // Return the created game
    const created = await formatGame({
      id: gameId, name, slug: gameSlug, description, price, currency, image, category, 
      is_popular: isPop, stock, discount_price: discountPrice
    }, pkgsToInsert);
    
    res.status(201).json(created);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/games/:id
router.put('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { 
      name, slug, description, price, currency, image, category, isPopular, stock, discountPrice,
      packagesList, packages, packagePrices, packageDiscountPrices
    } = req.body;

    await client.query('BEGIN');

    // Check if game exists
    const checkRes = await client.query('SELECT * FROM games WHERE id = $1 OR slug = $1', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Game not found' });
    }
    const existingGame = checkRes.rows[0];
    const realId = existingGame.id;

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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      name, slug, description, price !== undefined ? Number(price) : undefined, currency,
      image, category, isPopular !== undefined ? !!isPopular : undefined, 
      stock !== undefined ? Number(stock) : undefined, 
      discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : undefined,
      realId
    ]);

    // Update Packages if provided
    // If packagesList or packages is provided, we replace all packages.
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
    res.json(formatGame(game, packages_data));

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/games/:id
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const resDb = await pool.query('DELETE FROM games WHERE id = $1 OR slug = $1 RETURNING id', [id]);
    
    if (resDb.rowCount === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    await logAudit('delete_game', `Deleted game: ${id}`, req.user);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    console.error('DB Error (category), falling back to JSON:', error.message);
    const allGames = readGamesFile();
    const filtered = allGames.filter(g => (g.category || '').toLowerCase() === category.toLowerCase());
    res.json(filtered.map(g => formatGame(g)));
  }
});

// GET /api/games/:id/packages
router.get('/:id/packages', async (req, res) => {
  const { id } = req.params;
  try {
    const resDb = await pool.query('SELECT * FROM game_packages WHERE game_id = $1 ORDER BY price ASC', [id]);
    
    // Map to frontend expected format if needed, but for now return raw
    // Frontend expects: amount (name), price, discountPrice
    const items = resDb.rows.map(p => ({
      ...p,
      amount: p.name, // compatibility
      discountPrice: p.discount_price ? Number(p.discount_price) : null,
      price: Number(p.price)
    }));
    res.json(items);
  } catch (error) {
    console.error('DB Error (packages), falling back to JSON:', error.message);
    const allGames = readGamesFile();
    const game = allGames.find(g => g.id === id || g.slug === id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    const formatted = formatGame(game);
    // formatted.packagesList contains the standard objects
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
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { packages } = req.body; // Array of { amount/name, price, discountPrice, image }

    await client.query('BEGIN');
    
    // Verify game exists
    const gameCheck = await client.query('SELECT id FROM games WHERE id = $1', [id]);
    if (gameCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Game not found' });
    }

    // Replace all packages
    await client.query('DELETE FROM game_packages WHERE game_id = $1', [id]);
    
    if (Array.isArray(packages)) {
      for (const pkg of packages) {
        const name = pkg.name || pkg.amount;
        if (name) {
          await client.query(`
            INSERT INTO game_packages (game_id, name, price, discount_price, image)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            id, name, Number(pkg.price || 0), 
            pkg.discountPrice ? Number(pkg.discountPrice) : null,
            pkg.image || null
          ]);
        }
      }
    }

    await client.query('COMMIT');
    
    // Return updated packages
    const resDb = await pool.query('SELECT * FROM game_packages WHERE game_id = $1 ORDER BY price ASC', [id]);
    const items = resDb.rows.map(p => ({
      ...p,
      amount: p.name,
      discountPrice: p.discount_price ? Number(p.discount_price) : null,
      price: Number(p.price)
    }));
    
    await logAudit('update_packages', `Updated packages for game: ${id}`, req.user);
    res.json(items);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

export default router;
