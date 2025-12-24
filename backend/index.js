import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { execSync } from 'child_process';
import pkg from 'pg';
import * as https from 'https';
import dns from 'dns';
import { storage as memStorage } from './storage.js';
import { startWhatsApp, getQRCode, getConnectionStatus, sendWhatsAppMessage } from './whatsapp.js';
import requestLogger from './middleware/logger.js';
import errorHandler from './middleware/error.js';
import pool, { checkConnection, preferIPv4 } from './db.js';

dotenv.config();

// Auto-install dependencies if node_modules is missing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeModulesPath = path.join(__dirname, 'node_modules');
const pgModulePath = path.join(nodeModulesPath, 'pg');
const baileysModulePath = path.join(nodeModulesPath, '@whiskeysockets', 'baileys');

if (!fs.existsSync(pgModulePath) || !fs.existsSync(baileysModulePath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { 
      cwd: __dirname, 
      stdio: 'inherit' 
    });
    console.log('✓ Dependencies installed successfully\n');
  } catch (err) {
    console.error('✗ Failed to install dependencies:', err.message);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@diaaldeen.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CDN_BASE_URL = process.env.CDN_BASE_URL || '';

// PostgreSQL Connection Pool - Imported from db.js

// In-memory QR sessions
const qrSessions = new Map();
const rateStore = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 100;
function adminRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateStore.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count += 1;
  rateStore.set(ip, entry);
  if (entry.count > RATE_MAX_REQUESTS) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
  next();
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://diaaa.vercel.app',
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestLogger);
app.use('/api/admin', adminRateLimiter);

// Game verification routes

// Static file serving
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public'); // Changed from ../public to ./public

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Serve public assets (images, etc)
app.use('/public', express.static(publicDir));
app.use(express.static(publicDir));
const attachedAssetsDir = path.join(__dirname, 'public', 'attached_assets');
if (!fs.existsSync(attachedAssetsDir)) {
  try { fs.mkdirSync(attachedAssetsDir, { recursive: true }); } catch {}
}
app.use('/attached_assets', express.static(attachedAssetsDir));
app.use('/assets', express.static(attachedAssetsDir));

// ===============================================
// API ENDPOINTS (Added as requested)
// ===============================================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categoriesPath = path.join(__dirname, 'data', 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      const data = fs.readFileSync(categoriesPath, 'utf8');
      const categories = JSON.parse(data);
      return res.json(categories);
    }
    
    // Fallback to database if file doesn't exist
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get popular games
app.get('/api/games/popular', async (req, res) => {
  try {
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const popularGames = games.filter(g => g.isPopular);
      return res.json(popularGames);
    }

    // Fallback to database
    const result = await pool.query('SELECT * FROM games WHERE "isPopular" = true OR isPopular = true LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching popular games:', err);
    res.status(500).json({ message: 'Failed to fetch popular games' });
  }
});

// Global Error Handler
app.use(errorHandler);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true); else cb(new Error('Unsupported image type'));
  }
});

// Initialize Database Tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'EGP',
        image VARCHAR(255),
        category VARCHAR(100),
        isPopular BOOLEAN DEFAULT false,
        stock INTEGER DEFAULT 100,
        packages JSONB DEFAULT '[]',
        packagePrices JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Additional fields requested
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS category_id VARCHAR(50)`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS stock_amount INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2)`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS package_discount_prices JSONB DEFAULT '[]'`);

    // Game cards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_cards (
        id VARCHAR(50) PRIMARY KEY,
        game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
        card_code VARCHAR(200) NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image VARCHAR(255),
        gradient VARCHAR(100),
        icon VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        payment_method VARCHAR(50) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) REFERENCES transactions(id) ON DELETE CASCADE,
        game_id VARCHAR(50) REFERENCES games(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_confirmations (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) REFERENCES transactions(id) ON DELETE CASCADE,
        message_encrypted TEXT,
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) REFERENCES transactions(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_connections (
        id VARCHAR(50) PRIMARY KEY,
        phone_number_id VARCHAR(100) UNIQUE,
        business_account_id VARCHAR(100),
        display_number VARCHAR(30),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id VARCHAR(50) PRIMARY KEY,
        wa_message_id VARCHAR(100),
        direction VARCHAR(10) NOT NULL,
        from_phone VARCHAR(30),
        to_phone VARCHAR(30),
        message_encrypted TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'received'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(50) PRIMARY KEY,
        sender VARCHAR(20) NOT NULL,
        message_encrypted TEXT NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_alerts (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT false,
        flagged BOOLEAN DEFAULT false
      );
    `);

    console.log('✓ Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

// Seed product images from public folder
async function seedProductImages() {
  try {
    const publicDir = path.join(__dirname, 'public');
    
    if (!fs.existsSync(publicDir)) {
      console.log('⚠️  Public folder not found, skipping image seeding');
      return;
    }

    const files = fs.readdirSync(publicDir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    
    if (files.length === 0) {
      console.log('⚠️  No images found in public folder');
      return;
    }

    // Get all games
    const games = await pool.query('SELECT id FROM games');
    
    if (games.rowCount === 0) {
      console.log('ℹ️  No products to seed images for');
      return;
    }

    console.log(`🖼️  Seeding ${games.rowCount} products with ${files.length} images...`);

    let imageIndex = 0;
    for (const game of games.rows) {
      const imageName = files[imageIndex % files.length];
      const imagePath = `/${imageName}`;
      
      await pool.query(
        'UPDATE games SET image = $1 WHERE id = $2',
        [imagePath, game.id]
      );
      
      imageIndex++;
    }

    console.log(`✓ Seeded product images`);
  } catch (err) {
    console.error('Image seeding error:', err.message);
  }
}

// ===============================================
// AUTHENTICATION ENDPOINTS
// ===============================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, email, role: 'admin' });
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/verify', authenticateToken, async (req, res) => {
  try {
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// QR Auth: Start session
app.post('/api/auth/qr/start', async (req, res) => {
  try {
    const id = `qr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const token = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    qrSessions.set(id, { token, status: 'pending', createdAt: now, expiresAt });
    res.json({ id, token, expiresAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// QR Auth: Check status
app.get('/api/auth/qr/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const s = qrSessions.get(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (Date.now() > s.expiresAt && s.status !== 'approved') {
      s.status = 'expired';
    }
    res.json({ status: s.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// QR Auth: Confirm from mobile
app.post('/api/auth/qr/confirm', async (req, res) => {
  try {
    const { id, token } = req.body || {};
    const s = qrSessions.get(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (s.status === 'expired') return res.status(400).json({ message: 'Expired' });
    if (Date.now() > s.expiresAt) {
      s.status = 'expired';
      return res.status(400).json({ message: 'Expired' });
    }
    if (s.token !== token) return res.status(403).json({ message: 'Invalid' });
    s.status = 'approved';
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// QR Auth: Consume and issue JWT
app.post('/api/auth/qr/consume', async (req, res) => {
  try {
    const { id } = req.body || {};
    const s = qrSessions.get(id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    if (s.status !== 'approved') return res.status(400).json({ message: 'Not approved' });
    const email = ADMIN_EMAIL;
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    qrSessions.delete(id);
    res.json({ token, user: { email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== ADMIN: GAME CARDS =====================
function sanitizeString(input) {
  const s = String(input || '').trim();
  return s.replace(/[\r\n\t]/g, '').slice(0, 200);
}
app.get('/api/admin/game-cards', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 20;
    const offset = (page - 1) * limit;
    const rows = await pool.query('SELECT * FROM game_cards ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const total = await pool.query('SELECT COUNT(*) as count FROM game_cards');
    res.json({ items: rows.rows, page, limit, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/game-cards', authenticateToken, async (req, res) => {
  try {
    const { game_id } = req.body || {};
    const card_code = sanitizeString(req.body?.card_code);
    if (!game_id || !card_code) {
      return res.status(400).json({ message: 'Invalid card data' });
    }
    const id = `card_${Date.now()}`;
    await pool.query('INSERT INTO game_cards (id, game_id, card_code) VALUES ($1, $2, $3)', [id, game_id, card_code]);
    res.status(201).json({ id, game_id, card_code, is_used: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/game-cards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_used } = req.body || {};
    const card_code = req.body?.card_code ? sanitizeString(req.body.card_code) : undefined;
    const result = await pool.query('UPDATE game_cards SET is_used = COALESCE($1, is_used), card_code = COALESCE($2, card_code) WHERE id = $3 RETURNING *', [is_used, card_code, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Card not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/game-cards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM game_cards WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Card not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Map requested fields in games create/update
function normalizeGamePayload(body) {
  const name = String(body.name || '').trim();
  const description = body.description ?? null;
  const price = Number(body.price || body.price_amount || 0);
  const category_id = body.category_id || body.category || null;
  const stock_amount = body.stock_amount ?? body.stock ?? null;
  const image_url = body.image_url ?? body.image ?? null;
  return { name, description, price, category_id, stock_amount, image_url };
}

// ===============================================
// GAMES ENDPOINTS
// ===============================================

// Get all games
app.get('/api/games', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, description, price, currency, image, category, 
             is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
             discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
      FROM games 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get popular games
app.get('/api/games/popular', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, description, price, currency, image, category, 
             is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
             discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
      FROM games 
      WHERE is_popular = true 
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching popular games:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get games by category
app.get('/api/games/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(`
      SELECT id, name, slug, description, price, currency, image, category, 
             is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
             discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
      FROM games 
      WHERE category = $1 OR category_id = $1
      ORDER BY id DESC
    `, [category]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching games by category:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get game by slug
app.get('/api/games/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT id, name, slug, description, price, currency, image, category, 
             is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
             discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
      FROM games 
      WHERE slug = $1
    `, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching game by slug:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/games/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT id, name, slug, description, price, currency, image, category, 
             is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
             discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
      FROM games 
      WHERE slug = $1
    `, [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/games/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create game (Admin)
app.post('/api/admin/games', authenticateToken, imageUpload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, price, currency, category, isPopular, stock, discountPrice, packages, packagePrices, packageDiscountPrices } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const id = `game_${Date.now()}`;
    
    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const isPop = String(isPopular) === 'true';
    const packagesJson = packages ? JSON.stringify(Array.isArray(packages) ? packages : [packages]) : '[]';
    const packagePricesJson = packagePrices ? JSON.stringify(Array.isArray(packagePrices) ? packagePrices : [packagePrices]) : '[]';
    const packageDiscountPricesJson = packageDiscountPrices ? JSON.stringify(Array.isArray(packageDiscountPrices) ? packageDiscountPrices : [packageDiscountPrices]) : '[]';

    const result = await pool.query(
      `INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price, packages, package_prices, package_discount_prices) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING id, name, slug, description, price, currency, image, category, is_popular as "isPopular", stock, 
                 discount_price as "discountPrice", packages, package_prices as "packagePrices", 
                 package_discount_prices as "packageDiscountPrices"`,
      [id, name, finalSlug, description, Number(price) || 0, currency || 'EGP', image, category, isPop, Number(stock) || 100, 
       discountPrice ? Number(discountPrice) : null, packagesJson, packagePricesJson, packageDiscountPricesJson]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update game (Admin)
app.put('/api/admin/games/:id', authenticateToken, imageUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, currency, category, isPopular, stock, discountPrice, packages, packagePrices, packageDiscountPrices } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    
    const isPop = String(isPopular) === 'true';
    const packagesJson = packages ? JSON.stringify(Array.isArray(packages) ? packages : [packages]) : undefined;
    const packagePricesJson = packagePrices ? JSON.stringify(Array.isArray(packagePrices) ? packagePrices : [packagePrices]) : undefined;
    const packageDiscountPricesJson = packageDiscountPrices ? JSON.stringify(Array.isArray(packageDiscountPrices) ? packageDiscountPrices : [packageDiscountPrices]) : undefined;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name); }
    if (slug !== undefined) { updates.push(`slug = $${paramIndex++}`); values.push(slug); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (price !== undefined) { updates.push(`price = $${paramIndex++}`); values.push(Number(price) || 0); }
    if (currency !== undefined) { updates.push(`currency = $${paramIndex++}`); values.push(currency); }
    if (image !== undefined) { updates.push(`image = $${paramIndex++}`); values.push(image); }
    if (category !== undefined) { updates.push(`category = $${paramIndex++}`); values.push(category); }
    if (isPopular !== undefined) { updates.push(`is_popular = $${paramIndex++}`); values.push(isPop); }
    if (stock !== undefined) { updates.push(`stock = $${paramIndex++}`); values.push(Number(stock) || 0); }
    if (discountPrice !== undefined) { updates.push(`discount_price = $${paramIndex++}`); values.push(discountPrice ? Number(discountPrice) : null); }
    if (packagesJson !== undefined) { updates.push(`packages = $${paramIndex++}`); values.push(packagesJson); }
    if (packagePricesJson !== undefined) { updates.push(`package_prices = $${paramIndex++}`); values.push(packagePricesJson); }
    if (packageDiscountPricesJson !== undefined) { updates.push(`package_discount_prices = $${paramIndex++}`); values.push(packageDiscountPricesJson); }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE games 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, name, slug, description, price, currency, image, category, is_popular as "isPopular", stock,
                discount_price as "discountPrice", packages, package_prices as "packagePrices",
                package_discount_prices as "packageDiscountPrices"
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete game (Admin)
app.delete('/api/admin/games/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===============================================
// CATEGORIES ENDPOINTS
// ===============================================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get category by ID
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create category (Admin)
app.post('/api/admin/categories', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, gradient, icon } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const id = `cat_${Date.now()}`;

    const result = await pool.query(
      'INSERT INTO categories (id, name, slug, description, image, gradient, icon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, slug, description, image, gradient, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update category (Admin)
app.put('/api/admin/categories/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, gradient, icon } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    const result = await pool.query(
      'UPDATE categories SET name = $1, slug = $2, description = $3, image = $4, gradient = $5, icon = $6 WHERE id = $7 RETURNING *',
      [name, slug, description, image, gradient, icon, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete category (Admin)
app.delete('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===============================================
// SEARCH & UTILITIES
// ===============================================

// ===============================================
// IMPORT / EXPORT UTILS
// ===============================================

app.post('/api/admin/import-cards', authenticateToken, async (req, res) => {
  try {
    const datasetPath = path.join(__dirname, '..', 'digital_cards_egp_dataset.json');
    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({ message: 'Dataset file not found' });
    }

    const rawData = fs.readFileSync(datasetPath, 'utf8');
    const dataset = JSON.parse(rawData);
    
    if (!Array.isArray(dataset.products)) {
      return res.status(400).json({ message: 'Invalid dataset format' });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const logs = [];

    // Map dataset product names to game names/slugs
    // Simple mapping logic: name includes game name
    const games = await pool.query('SELECT * FROM games');
    
    for (const product of dataset.products) {
      const game = games.rows.find(g => 
        product.product_name.toLowerCase().includes(g.name.toLowerCase()) || 
        g.name.toLowerCase().includes(product.product_name.toLowerCase())
      );

      if (game) {
        // Update packages and prices
        let packages = game.packages || [];
        let prices = game.package_prices || [];
        
        // Ensure arrays
        if (!Array.isArray(packages)) packages = [];
        if (!Array.isArray(prices)) prices = [];

        // Check if package already exists
        const pkgName = product.denomination;
        const pkgPrice = String(product.price_EGP);
        
        if (!packages.includes(pkgName)) {
          packages.push(pkgName);
          prices.push(pkgPrice);
          
          await pool.query(
            'UPDATE games SET packages = $1, package_prices = $2, stock = GREATEST(stock, $3) WHERE id = $4',
            [JSON.stringify(packages), JSON.stringify(prices), product.stock_estimate || 0, game.id]
          );
          updatedCount++;
          logs.push(`Updated ${game.name} with ${pkgName}`);
        } else {
           skippedCount++;
        }
      } else {
        skippedCount++;
        logs.push(`Skipped ${product.product_name} - No matching game found`);
      }
    }

    res.json({ message: 'Import completed', updated: updatedCount, skipped: skippedCount, logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search games
app.get('/api/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    
    let query = 'SELECT * FROM games WHERE 1=1';
    const params = [];

    if (q) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
      params.push(`%${q}%`);
    }

    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }

    if (minPrice) {
      query += ' AND price >= $' + (params.length + 1);
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND price <= $' + (params.length + 1);
      params.push(parseFloat(maxPrice));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stats (Admin)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const gamesCount = await pool.query('SELECT COUNT(*) as count FROM games');
    const categoriesCount = await pool.query('SELECT COUNT(*) as count FROM categories');
    const totalStock = await pool.query('SELECT SUM(stock) as total FROM games');
    const totalValue = await pool.query('SELECT SUM(price * stock) as total FROM games');
    const popularGames = await pool.query('SELECT COUNT(*) as count FROM games WHERE is_popular = true');
    const lowStock = await pool.query('SELECT COUNT(*) as count FROM games WHERE stock < 10');

    res.json({
      totalGames: parseInt(gamesCount.rows[0].count),
      totalCategories: parseInt(categoriesCount.rows[0].count),
      totalStock: parseInt(totalStock.rows[0].total || 0),
      totalValue: parseFloat(totalValue.rows[0].total || 0),
      popularGames: parseInt(popularGames.rows[0].count),
      lowStockGames: parseInt(lowStock.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export data (Admin)
app.get('/api/admin/export', authenticateToken, async (req, res) => {
  try {
    const games = await pool.query('SELECT * FROM games');
    const categories = await pool.query('SELECT * FROM categories');

    res.json({
      games: games.rows,
      categories: categories.rows,
      exportDate: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload file
app.post('/api/admin/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileUrl = null;
    try {
      if (CDN_BASE_URL) {
        fileUrl = new URL(`/uploads/${req.file.filename}`, CDN_BASE_URL).toString();
      } else {
        const host = req.get('host');
        const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http');
        fileUrl = `${proto}://${host}/uploads/${req.file.filename}`;
      }
    } catch {
      fileUrl = `/uploads/${req.file.filename}`;
    }
    // Verify file exists
    let verified = false;
    try {
      fs.accessSync(path.join(uploadDir, req.file.filename), fs.constants.R_OK);
      verified = true;
    } catch {}

    res.json({
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      url: fileUrl,
      verified
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/transactions/checkout', async (req, res) => {
  try {
    const { customerName, customerPhone, paymentMethod, items } = req.body;
    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    const userId = `user_${Date.now()}`;
    await pool.query(
      'INSERT INTO users (id, name, phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [userId, customerName, customerPhone]
    );
    const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
    const transactionId = `txn_${Date.now()}`;
    await pool.query(
      'INSERT INTO transactions (id, user_id, payment_method, total, status) VALUES ($1, $2, $3, $4, $5)',
      [transactionId, userId, paymentMethod || 'Unknown', total, 'pending']
    );
    for (const it of items) {
      const itemId = `txi_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      await pool.query(
        'INSERT INTO transaction_items (id, transaction_id, game_id, quantity, price) VALUES ($1, $2, $3, $4, $5)',
        [itemId, transactionId, it.id, Number(it.quantity), Number(it.price)]
      );
      await pool.query('UPDATE games SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [Number(it.quantity), it.id]);
    }
    
    // Send WhatsApp Confirmation
    try {
      const waMessage = `New Order #${transactionId}\nTotal: $${total}\nCustomer: ${customerName} (${customerPhone})\nItems:\n${items.map(i => `- ${i.title} (x${i.quantity})`).join('\n')}`;
      await sendWhatsAppMessage(customerPhone, `Thank you for your order #${transactionId}! We are processing it.`);
      // Optionally notify admin
      if (process.env.ADMIN_PHONE) {
         await sendWhatsAppMessage(process.env.ADMIN_PHONE, waMessage);
      }
    } catch (waErr) {
      console.error('Failed to send WhatsApp confirmation:', waErr.message);
    }

    res.status(201).json({ id: transactionId, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (tx.rows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    const items = await pool.query('SELECT * FROM transaction_items WHERE transaction_id = $1', [id]);
    res.json({ transaction: tx.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const receiptUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true); else cb(new Error('Unsupported file type'));
  }
});

function encryptMessage(plain) {
  const key = (process.env.PAYMENT_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') });
}

function httpsPostJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers }
      }, (res) => {
        let chunks = '';
        res.on('data', (d) => { chunks += d; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: chunks });
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify(body || {}));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

app.post('/api/transactions/confirm', receiptUpload.single('receipt'), async (req, res) => {
  try {
    const { transactionId, message } = req.body;
    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId required' });
    }
    const txRes = await pool.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const tx = txRes.rows[0];
    const createdAt = new Date(tx.created_at);
    if (Date.now() - createdAt.getTime() > 30 * 60 * 1000) {
      return res.status(401).json({ message: 'Session expired' });
    }
    const encMsg = message ? encryptMessage(String(message)) : null;
    const url = req.file ? `${CDN_BASE_URL || ''}/uploads/${req.file.filename}`.replace(/\/\/+/g, '/') : null;
    const id = `pc_${Date.now()}`;
    await pool.query(
      'INSERT INTO payment_confirmations (id, transaction_id, message_encrypted, receipt_url) VALUES ($1, $2, $3, $4)',
      [id, transactionId, encMsg, url]
    );
    const auditId = `pa_${Date.now()}`;
    await pool.query(
      'INSERT INTO payment_audit_logs (id, transaction_id, action, summary) VALUES ($1, $2, $3, $4)',
      [auditId, transactionId, 'confirm', 'Buyer submitted payment confirmation']
    );
    res.status(201).json({ id, receiptUrl: url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Alerts
app.get('/api/admin/alerts', authenticateToken, async (req, res) => {
  try {
    const { status, type, q } = req.query;
    let alerts = await memStorage.getSellerAlerts();
    
    if (status === 'unread') {
      alerts = alerts.filter(a => !a.read);
    }
    
    if (type) {
      alerts = alerts.filter(a => a.type === type);
    }
    
    if (q) {
      const lowerQ = q.toLowerCase();
      alerts = alerts.filter(a => a.summary.toLowerCase().includes(lowerQ));
    }
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/alerts/:id/read', authenticateToken, async (req, res) => {
  await memStorage.markSellerAlertRead(req.params.id);
  res.json({ success: true });
});

// ===================== CONTENT MANAGEMENT =====================

// Posts
app.get('/api/posts', async (req, res) => {
  const posts = await memStorage.getPosts();
  res.json(posts);
});

app.post('/api/admin/posts', authenticateToken, async (req, res) => {
  try {
    const post = await memStorage.createPost(req.body);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/posts/:id', authenticateToken, async (req, res) => {
  try {
    const post = await memStorage.updatePost(req.params.id, req.body);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/posts/:id', authenticateToken, async (req, res) => {
  await memStorage.deletePost(req.params.id);
  res.sendStatus(204);
});

// Tutorials
app.get('/api/tutorials', async (req, res) => {
  const tutorials = await memStorage.getTutorials();
  res.json(tutorials);
});

app.post('/api/admin/tutorials', authenticateToken, async (req, res) => {
  try {
    const tut = await memStorage.createTutorial(req.body);
    res.status(201).json(tut);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/tutorials/:id', authenticateToken, async (req, res) => {
  try {
    const tut = await memStorage.updateTutorial(req.params.id, req.body);
    if (!tut) return res.status(404).json({ message: 'Tutorial not found' });
    res.json(tut);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/tutorials/:id', authenticateToken, async (req, res) => {
  await memStorage.deleteTutorial(req.params.id);
  res.sendStatus(204);
});

// SEO Settings
app.get('/api/public/settings/seo', async (req, res) => {
  const seo = await memStorage.getSeoSettings();
  res.json(seo);
});

app.post('/api/admin/settings/seo', authenticateToken, async (req, res) => {
  try {
    const seo = await memStorage.updateSeoSettings(req.body);
    res.json(seo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cards Import
app.post('/api/admin/import-cards', authenticateToken, async (req, res) => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) return res.status(400).json({ message: 'cards array required' });
    
    // In a real app, we would process these cards and add them to inventory
    // For now, we'll just log them and return success
    console.log(`Importing ${cards.length} cards...`);
    
    // Example: Update stock for matching games
    // This is a simplified logic
    let updatedCount = 0;
    for (const card of cards) {
       // logic to find game by card.game_id or slug and update stock
       updatedCount++;
    }
    
    res.json({ message: `Successfully processed ${updatedCount} cards` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


function sendSMS(phone, text) {
  console.log('SMS to', phone, ':', text);
}

app.post('/api/admin/transactions/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, link } = req.body;
    const txRes = await pool.query('SELECT t.*, u.phone FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = $1', [id]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const phone = txRes.rows[0].phone;
    const auditId = `pa_${Date.now()}`;
    await pool.query('INSERT INTO payment_audit_logs (id, transaction_id, action, summary) VALUES ($1, $2, $3, $4)', [auditId, id, 'respond', 'Seller responded to payment confirmation']);
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const text = `New message regarding your order - please check your account on ${siteUrl}. Ref: ${id}`;
    sendSMS(phone, text);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== WHATSAPP INTEGRATION =====================

// Baileys QR Integration
app.get('/api/admin/whatsapp/qr', authenticateToken, (req, res) => {
  const qr = getQRCode();
  const status = getConnectionStatus();
  res.json({ qr, status });
});

app.get('/api/admin/whatsapp/status', authenticateToken, (req, res) => {
  res.json(getConnectionStatus());
});

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

app.get('/api/admin/whatsapp/config', authenticateToken, async (req, res) => {
  try {
    res.json({
      connected: Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID),
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/whatsapp/send', authenticateToken, async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ message: 'to and text required' });

    // Try Baileys first
    try {
      const result = await sendWhatsAppMessage(to, text);
      return res.json({ ok: true, id: result.id });
    } catch (baileysErr) {
      console.warn('Baileys send failed, trying Cloud API:', baileysErr.message);
    }

    // Fallback to Cloud API
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(500).json({ message: 'WhatsApp not connected (Baileys failed, Cloud API not config)' });
    }
    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };
    const resp = await httpsPostJson(url, { Authorization: `Bearer ${WHATSAPP_TOKEN}` }, payload);
    const id = `wam_${Date.now()}`;
    await pool.query('INSERT INTO whatsapp_messages (id, direction, from_phone, to_phone, message_encrypted, status) VALUES ($1, $2, $3, $4, $5, $6)', [
      id, 'outbound', null, to, encryptMessage(text), resp.status === 200 ? 'sent' : 'error'
    ]);
    res.status(resp.status || 200).json({ ok: resp.status === 200, response: resp.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Webhook verification
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Webhook receiver
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const body = req.body;
    const entry = Array.isArray(body?.entry) ? body.entry[0] : null;
    const changes = entry?.changes?.[0]?.value;
    const messages = changes?.messages;
    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        const from = m?.from;
        const to = changes?.metadata?.display_phone_number || null;
        const text = m?.text?.body || '';
        const waId = m?.id || null;
        const sessionId = `wa_${from}`;
        const id = `wam_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        await pool.query('INSERT INTO whatsapp_messages (id, wa_message_id, direction, from_phone, to_phone, message_encrypted, session_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
          id, waId, 'inbound', from, to, encryptMessage(text), sessionId, 'received'
        ]);
        const cmId = `cm_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        await pool.query('INSERT INTO chat_messages (id, sender, message_encrypted, session_id) VALUES ($1, $2, $3, $4)', [
          cmId, 'user', encryptMessage(text), sessionId
        ]);
        const alertId = `al_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        const summary = `New WhatsApp message from ${from}: ${text.substring(0, 120)}`;
        await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [alertId, 'whatsapp_message', summary]);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(200);
  }
});

// ===================== CHAT ENDPOINTS =====================

app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query('SELECT id, sender, message_encrypted, session_id, timestamp FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC', [sessionId]);
    const messages = result.rows.map(r => ({ id: r.id, sender: r.sender, message: '[encrypted]', sessionId: r.session_id, timestamp: new Date(r.timestamp).getTime() }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/chat/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, sender, message_encrypted, session_id, timestamp FROM chat_messages ORDER BY timestamp DESC LIMIT 500');
    const messages = result.rows.map(r => ({ id: r.id, sender: r.sender, message: '[encrypted]', sessionId: r.session_id, timestamp: new Date(r.timestamp).getTime() }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    const { sender, message, sessionId } = req.body;
    if (!sender || !message || !sessionId) return res.status(400).json({ message: 'sender, message, sessionId required' });
    const id = `cm_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    await pool.query('INSERT INTO chat_messages (id, sender, message_encrypted, session_id) VALUES ($1, $2, $3, $4)', [
      id, sender, encryptMessage(String(message)), sessionId
    ]);
    if (sender === 'user') {
      const alertId = `al_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const summary = `Website message in ${sessionId}: ${String(message).substring(0, 120)}`;
      await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [alertId, 'website_message', summary]);
    }
    if (sender === 'support' && sessionId.startsWith('wa_') && WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      const to = sessionId.replace('wa_', '');
      const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body: String(message) } };
      try { await httpsPostJson(url, { Authorization: `Bearer ${WHATSAPP_TOKEN}` }, payload); } catch {}
    }
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== SELLER ALERTS =====================

app.get('/api/admin/alerts', authenticateToken, async (req, res) => {
  try {
    const { status, type, q } = req.query;
    
    let query = 'SELECT * FROM seller_alerts WHERE 1=1';
    const params = [];

    if (status === 'unread') {
      query += ' AND read = false';
    } else if (status === 'read') {
      query += ' AND read = true';
    }
    
    if (type && type !== 'all') {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }
    
    if (q) {
      query += ' AND summary ILIKE $' + (params.length + 1);
      params.push(`%${q}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 200';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Support both POST and PUT for compatibility
app.post('/api/admin/alerts/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE seller_alerts SET read = true WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/alerts/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE seller_alerts SET read = true WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/alerts/:id/flag', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE seller_alerts SET flagged = true WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Diagnostics: DB & Storage
app.get('/api/admin/db/diagnose', authenticateToken, async (req, res) => {
  try {
    const host = process.env.PGHOST || (() => { try { return new URL(process.env.DATABASE_URL || '').hostname; } catch { return ''; } })();
    let dnsStatus = { host, ok: false, error: null, address: null, family: null };
    await new Promise(resolve => {
      if (!host) return resolve();
      dns.lookup(host, (err, address, family) => {
        if (err) dnsStatus = { host, ok: false, error: err.message, address: null, family: null };
        else dnsStatus = { host, ok: true, error: null, address, family };
        resolve();
      });
    });
    const dbOk = await checkConnection(1, 1);
    res.json({ dns: dnsStatus, db: { ok: dbOk } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/storage/health', authenticateToken, (req, res) => {
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const testFile = path.join(uploadDir, 'write_test.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    res.json({ writable: true, path: uploadDir });
  } catch (err) {
    res.status(500).json({ writable: false, path: uploadDir, message: err.message });
  }
});

// API Info
app.get('/', (req, res) => {
  res.json({
    name: 'GameCart Backend API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
const startServer = async () => {
  try {
    // 1. Verify Database Connection
    console.log('🔄 Checking database connection...');
    try { await preferIPv4(); } catch {}
    const isConnected = await checkConnection(3, 2000);
    
    if (isConnected) {
      try {
        if (typeof initializeDatabase === 'function') await initializeDatabase();
        if (typeof seedProductImages === 'function') await seedProductImages();
      } catch (dbErr) {
        console.error('⚠️ Database initialization warning:', dbErr.message);
      }
    } else {
      console.error('❌ Database connection failed. API endpoints requiring DB will fail.');
      console.log('⚠️ Server starting in partial functionality mode.');
    }

    // 2. Verify Uploads Directory
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('✅ Created uploads directory at:', uploadDir);
      }
      // Test write permission
      const testFile = path.join(uploadDir, 'write_test.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Uploads directory is writable');
    } catch (err) {
      console.error('❌ Uploads directory error:', err.message);
    }
    
    // 3. Autoload startup modules
    async function resolveDir(rel) {
      try {
        const p = path.join(__dirname, rel);
        if (fs.existsSync(p)) return p;
        return null;
      } catch {
        return null;
      }
    }

    async function autoloadFrom(dirRel, context) {
      const dir = await resolveDir(dirRel);
      if (!dir) {
        console.log(`ℹ️  Autoload skipped: ${dirRel} not found`);
        return { loaded: 0, errors: 0 };
      }
      let loaded = 0; let errors = 0;
      try {
        const files = fs.readdirSync(dir).filter(f => /\.js$/i.test(f) && !/\.(test|spec)\.js$/i.test(f));
        files.sort((a,b) => {
          const pa = parseInt(a, 10); const pb = parseInt(b, 10);
          if (!isNaN(pa) && !isNaN(pb)) return pa - pb;
          return a.localeCompare(b);
        });
        for (const f of files) {
          const full = path.join(dir, f);
          try {
            const mod = await import(pathToFileURL(full).href);
            const fn = mod.init || mod.setup || mod.run || mod.seed || (typeof mod.default === 'function' ? mod.default : null);
            if (typeof fn === 'function') {
              await fn(context);
              console.log(`✓ Loaded ${dirRel}/${f}`);
              loaded++;
            } else {
              console.log(`ℹ️  Skipped ${dirRel}/${f} (no init function)`);
            }
          } catch (err) {
            console.error(`✗ Failed to load ${dirRel}/${f}: ${err.message}`);
            errors++;
          }
        }
      } catch (err) {
        console.error(`✗ Autoload error in ${dirRel}: ${err.message}`);
        errors++;
      }
      return { loaded, errors };
    }

    const autoResults = [];
    autoResults.push(await autoloadFrom('../startup', { app, pool }));
    autoResults.push(await autoloadFrom('../hooks', { app, pool }));
    autoResults.push(await autoloadFrom('../seeders', { app, pool }));
    const totalLoaded = autoResults.reduce((s,r)=>s+r.loaded,0);
    const totalErrors = autoResults.reduce((s,r)=>s+r.errors,0);
    console.log(`Autoload summary: ${totalLoaded} modules loaded, ${totalErrors} errors`);

    // 3.5 Run Critical Maintenance Scripts (skippable by env flag)
    const shouldRunMaintenance = String(process.env.DISABLE_MAINTENANCE_SCRIPTS || '').toLowerCase() !== 'true';
    if (shouldRunMaintenance) {
      console.log('🔧 Running maintenance scripts...');
      try {
        const scriptsDir = path.join(__dirname, 'scripts');
        const verifyScript = path.join(scriptsDir, 'verify-media.js');
        if (fs.existsSync(verifyScript)) {
           console.log('   Running verify-media.js...');
           execSync(`node "${verifyScript}"`, { stdio: 'inherit' });
        }
        const updateScript = path.join(scriptsDir, 'update-packages.js');
        if (fs.existsSync(updateScript)) {
           console.log('   Running update-packages.js...');
           execSync(`node "${updateScript}"`, { stdio: 'inherit' });
        }
        console.log('✅ Maintenance scripts completed');
      } catch (scriptErr) {
         console.error('⚠️ Maintenance script error:', scriptErr.message);
      }
    } else {
      console.log('⏭️  Maintenance scripts disabled by DISABLE_MAINTENANCE_SCRIPTS');
    }

    // 4. Start WhatsApp Client
    startWhatsApp().catch(err => console.error('Failed to start WhatsApp:', err));

    try {
      const routesPath = path.join(__dirname, 'routes', 'game-verification.js');
      if (fs.existsSync(routesPath)) {
        const mod = await import(pathToFileURL(routesPath).href);
        const r = mod.default || mod.router || mod;
        if (r) app.use(r);
      }
    } catch {}

    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║     GameCart Backend Server             ║');
      console.log(`║     Running on port ${PORT}              ║`);
      console.log(`║     Environment: ${process.env.NODE_ENV || 'development'}         ║`);
      console.log(`║     Database: ${isConnected ? 'Connected ✅' : 'Disconnected ❌'}       ║`);
      console.log('╚════════════════════════════════════════╝\n');
      
      console.log('API Documentation:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Games:');
      console.log('  GET    /api/games                  - Get all games');
      console.log('  GET    /api/games/:id              - Get game by ID');
      console.log('  GET    /api/games/slug/:slug       - Get game by slug');
      console.log('  GET    /api/games/popular          - Get popular games');
      console.log('  GET    /api/games/category/:cat    - Get games by category');
      console.log('  POST   /api/admin/games            - Create game (multipart)');
      console.log('  PUT    /api/admin/games/:id        - Update game (multipart)');
      console.log('  DELETE /api/admin/games/:id        - Delete game');
      console.log('\nCategories:');
      console.log('  GET    /api/categories             - Get all categories');
      console.log('  GET    /api/categories/:id         - Get category by ID');
      console.log('  POST   /api/admin/categories       - Create category (multipart)');
      console.log('  PUT    /api/admin/categories/:id   - Update category (multipart)');
      console.log('  DELETE /api/admin/categories/:id   - Delete category');
      console.log('\nUtilities:');
      console.log('  GET    /api/search                 - Search games (q, category, minPrice, maxPrice)');
      console.log('  GET    /api/admin/stats            - Dashboard statistics');
      console.log('  GET    /api/admin/export           - Export all data');
      console.log('  POST   /api/admin/import-cards     - Import cards from JSON');
      console.log('  POST   /api/admin/upload           - Upload file (multipart)');
      console.log('\nHealth:');
      console.log('  GET    /api/health                 - Health check');
      console.log('  GET    /                            - API info');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Startup complete');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

export default app;
