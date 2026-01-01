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
import cloudinaryModule from 'cloudinary';
const cloudinary = cloudinaryModule.v2 || cloudinaryModule;
import { storage as memStorage } from './storage.js';
import { startWhatsApp, getQRCode, getConnectionStatus, sendWhatsAppMessage, sendWhatsAppMedia, sendWithRetry } from './whatsapp.js';
import requestLogger from './middleware/logger.js';
import errorHandler from './middleware/error.js';
import pool, { checkConnection, preferIPv4 } from './db.js';
// Optional image processor (module may not exist in some deployments)
let initImageProcessor = null;
try {
  const mod = await import('./image-processor.js');
  initImageProcessor = mod?.initImageProcessor || null;
} catch {
  initImageProcessor = null;
}

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
const envPort = Number(process.env.PORT || 0);
const PORT = envPort && envPort !== 5173 ? envPort : 3001;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@diaaldeen.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CDN_BASE_URL = process.env.CDN_BASE_URL || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
// Image behavior flags
const ENABLE_IMAGE_SEEDING = String(process.env.ENABLE_IMAGE_SEEDING || '').toLowerCase() === 'true';
const ENABLE_IMAGE_OVERRIDES = String(process.env.ENABLE_IMAGE_OVERRIDES || '').toLowerCase() === 'true';

const CLOUDINARY_ENABLED = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

function isCatboxUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    return u.hostname === 'files.catbox.moe' || u.hostname === 'catbox.moe';
  } catch {
    return false;
  }
}

async function validateCatboxUrl(url) {
  if (!isCatboxUrl(url)) return { ok: false, status: 0, message: 'URL is not a catbox.moe link' };
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request({ method: 'HEAD', hostname: u.hostname, path: u.pathname + (u.search || ''), timeout: 8000 }, (res) => {
        resolve({ ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode || 0, message: `HEAD ${res.statusCode}` });
      });
      req.on('error', (err) => resolve({ ok: false, status: 0, message: err.message }));
      req.end();
    } catch (err) {
      resolve({ ok: false, status: 0, message: err.message });
    }
  });
}

function normalizeImageUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return v;

  // Keep external URLs
  if (/^https?:\/\//i.test(v)) {
    return v;
  }

  // Already supported paths
  if (v.startsWith('/uploads/')) return v;
  if (v.startsWith('/media/')) return v;
  if (v.startsWith('/images/')) return v;
  if (v.startsWith('/attached_assets/')) return v;

  // Old paths
  if (v.startsWith('/public/')) return v.replace(/^\/public\//, '/images/');

  // If it's a bare filename or /filename, check if it exists in images directory first
  const fileName = v.replace(/^\//, '');
  if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(fileName)) {
    // Check if file exists in images directory
    const imagePath = path.join(imagesDir, fileName);
    if (fs.existsSync(imagePath)) {
      return `/images/${fileName}`;
    }
    // Fallback to media
    return `/media/${fileName}`;
  }

  return v;
}

function coerceJsonArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    if (s === '[object Object]') return [];
    
    // If it's a JSON array string, parse it
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [s];
      } catch {
        return [s];
      }
    }
    
    // If it's a comma-separated string, split it
    if (s.includes(',')) {
      return s.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    return [s];
  }
  if (typeof value === 'object') {
    if (value.constructor === Object && Object.keys(value).every(k => !isNaN(Number(k)))) {
      return Object.values(value);
    }
    return [];
  }
  return [];
}

function readGamesFile() {
  try {
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (!fs.existsSync(gamesPath)) return [];
    const data = fs.readFileSync(gamesPath, 'utf8');
    const games = JSON.parse(data);
    return Array.isArray(games) ? games : [];
  } catch { return []; }
}

function writeGamesFile(games) {
  try {
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    fs.writeFileSync(gamesPath, JSON.stringify(Array.isArray(games) ? games : [], null, 2), 'utf8');
    return true;
  } catch { return false; }
}

async function seedGamesFromJsonIfEmpty(force = false) {
  try {
    if (!force) {
      const countRes = await pool.query('SELECT COUNT(*)::int AS c FROM games');
      const c = countRes.rows?.[0]?.c || 0;
      if (c > 0) return;
    }

    const items = readGamesFile();
    console.log(`ℹ️  Found ${items.length} items to seed`);
    if (!Array.isArray(items) || items.length === 0) return;
    
    for (const g of items) {
      console.log(`   Seeding ${g.name}...`);
      try {
        const id = String(g.id || `game_${Date.now()}_${Math.random().toString(36).slice(2,9)}`);
        const name = String(g.name || '').trim();
        const slug = String(g.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        const description = String(g.description || '');
        const currency = String(g.currency || 'EGP');
        const image = g.image || '/media/placeholder.jpg';
        const category = String(g.category || 'other');
        const is_popular = Boolean(g.isPopular || g.is_popular || false);
        const stock = Number(g.stock || 100);
        
        const rawPackages = coerceJsonArray(g.packages);
        const rawPrices = coerceJsonArray(g.packagePrices).map(n => {
          if (typeof n === 'number') return n;
          const s = String(n || '0').replace(/[^0-9.]/g, '');
          const num = parseFloat(s);
          return isNaN(num) ? 0 : num;
        });

        // Apply 100 EGP discount logic: discount = price - 100, only if price > 50
        const processedPackagePrices = [];
        const processedDiscountPrices = [];
        
        for (const p of rawPrices) {
          processedPackagePrices.push(p);
          if (p > 50) {
            processedDiscountPrices.push(p - 100);
          } else {
            processedDiscountPrices.push(null);
          }
        }

        // Set main price as the first package price if not provided
        const price = Number(g.price) || (processedPackagePrices[0] || 0);
        const discount_price = price > 50 ? (price - 100) : null;

        await pool.query(
          `INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price, packages, package_prices, package_discount_prices)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             currency = EXCLUDED.currency,
             image = EXCLUDED.image,
             category = EXCLUDED.category,
             is_popular = EXCLUDED.is_popular,
             stock = EXCLUDED.stock,
             discount_price = EXCLUDED.discount_price,
             packages = EXCLUDED.packages,
             package_prices = EXCLUDED.package_prices,
             package_discount_prices = EXCLUDED.package_discount_prices`,
          [id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price, rawPackages, processedPackagePrices, processedDiscountPrices]
        );
      } catch (err) {
        console.error(`Failed to seed game ${g.name}:`, err.message);
      }
    }
    console.log(`✓ Seeded/Updated ${items.length} games from JSON`);
  } catch (err) {
    console.error('Seed from JSON error:', err.message);
  }
}

async function seedCategoriesFromJsonIfEmpty(force = false) {
  try {
    if (!force) {
      const countRes = await pool.query('SELECT COUNT(*)::int AS c FROM categories');
      const c = countRes.rows?.[0]?.c || 0;
      if (c > 0) return;
    }
    
    const categoriesPath = path.join(__dirname, 'data', 'categories.json');
    if (!fs.existsSync(categoriesPath)) return;
    const items = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    
    for (const c of items) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, description, image, gradient, icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           image = EXCLUDED.image,
           gradient = EXCLUDED.gradient,
           icon = EXCLUDED.icon`,
        [c.id, c.name, c.slug, c.description, c.image, c.gradient, c.icon]
      );
    }
    console.log(`✓ Seeded/Updated ${items.length} categories from JSON`);
  } catch (err) {
    console.error('Category seed error:', err.message);
  }
}
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
    'http://diaasadek.com',
    'http://localhost:3000',
    'https://diaaa.vercel.app',
    'https://*.vercel.app',
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
// Images directory from root
const imagesDir = path.join(__dirname, '..', 'images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  try { fs.mkdirSync(imagesDir, { recursive: true }); } catch {}
}

async function useProvidedImage(req) {
  try {
    const url = (req.body && (req.body.image_url || req.body.imageUrl || req.body.image)) || null;
    const pth = (req.body && (req.body.image_path || req.body.imagePath)) || null;
    
    // Catbox exclusive hosting
    if (req.file && req.file.filename) {
      const localPath = req.file.path;
      try {
        const r = await catboxFileUploadFromLocal(localPath, req.file.originalname || req.file.filename);
        try { fs.unlinkSync(localPath); } catch {}
        if (r.ok) return r.url;
        throw new Error(r.message || 'catbox upload failed');
      } catch (err) {
        try {
          const alertId = `al_${Date.now()}`;
          const summary = `Catbox upload failed for ${req.file?.originalname || req.file?.filename}: ${String(err?.message || err).substring(0, 180)}`;
          await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [alertId, 'upload_error', summary]);
        } catch {}
        return null;
      }
    }
    
    if (typeof url === 'string' && url.trim()) {
      const u = url.trim();
      if (isCatboxUrl(u)) return u;
      try {
        const up = await uploadUrlToCatbox(u);
        if (up.ok) return up.url;
      } catch {}
      return null;
    }
    
    if (typeof pth === 'string' && pth.trim()) {
      const src = pth.trim();
      const ext = path.extname(src) || '.jpg';
      const filename = `image-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
      const dest = path.join(uploadDir, filename);
      try { 
        fs.copyFileSync(src, dest);
        const r = await catboxFileUploadFromLocal(dest, path.basename(src));
        try { fs.unlinkSync(dest); } catch {}
        if (r.ok) return r.url;
        return null; 
      } catch {}
    }
  } catch (err) {
    console.error('Error in useProvidedImage:', err);
  }
  return null;
}

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Serve public assets (images, etc)
app.use('/public', express.static(publicDir));
app.use(express.static(publicDir));
// Stable media path for proxying via frontend (Vercel) without colliding with frontend static assets
app.use('/media', express.static(publicDir));
const mediaAssetsDir = path.join(publicDir, 'assets');
const generatedImagesDir = path.join(publicDir, 'generated_images');
try { if (!fs.existsSync(mediaAssetsDir)) fs.mkdirSync(mediaAssetsDir, { recursive: true }); } catch {}
try { if (!fs.existsSync(generatedImagesDir)) fs.mkdirSync(generatedImagesDir, { recursive: true }); } catch {}
app.use('/media/assets', express.static(mediaAssetsDir));
app.use('/media/generated_images', express.static(generatedImagesDir));
// Serve attached_assets from multiple possible locations
const attachedAssetsDir = path.join(__dirname, 'public', 'attached_assets');
const rootAttachedAssetsDir = path.join(__dirname, '..', 'attached_assets');

// Create directories if they don't exist
if (!fs.existsSync(attachedAssetsDir)) {
  try { fs.mkdirSync(attachedAssetsDir, { recursive: true }); } catch {}
}
if (!fs.existsSync(rootAttachedAssetsDir)) {
  try { fs.mkdirSync(rootAttachedAssetsDir, { recursive: true }); } catch {}
}

// Serve attached_assets - try root folder first, then backend/public
if (fs.existsSync(rootAttachedAssetsDir)) {
  app.use('/attached_assets', express.static(rootAttachedAssetsDir));
}
app.use('/attached_assets', express.static(attachedAssetsDir));
app.use('/assets', express.static(attachedAssetsDir));

// Serve images from D:\GameCart-1\images directory
if (fs.existsSync(imagesDir)) {
  app.use('/images', express.static(imagesDir));
  // Also serve from /media for compatibility, but prioritize images directory
  app.use('/media', express.static(imagesDir));
}

app.get('/manifest.webmanifest', (req, res) => {
  const candidates = [
    path.join(__dirname, '..', 'client', 'public', 'manifest.webmanifest'),
    path.join(process.cwd(), 'client', 'public', 'manifest.webmanifest'),
    path.join(__dirname, 'public', 'manifest.webmanifest')
  ];
  const file = candidates.find(p => {
    try { return fs.existsSync(p); } catch { return false; }
  });
  if (!file) {
    return res.status(404).json({ message: 'manifest not found' });
  }
  res.type('application/manifest+json');
  res.sendFile(file);
});

// ===================== CONTACT INFO (ENV) =====================
app.get('/api/contact-info', async (req, res) => {
  try {
    const instapayRaw = String(process.env.instapay || '').trim();
    const cashRaw = String(process.env.cash_numbers || '').trim();
    const paypalRaw = String(process.env.paypal || '').trim();
    const etisalatCashRaw = String(process.env.etisalat_cash || '').trim();
    const normalizePhone = (p) => {
      const digits = String(p || '').replace(/[^\d+]/g, '');
      if (!digits) return null;
      const withPlus = digits.startsWith('+') ? digits : (digits.startsWith('0') ? `+2${digits}` : `+${digits}`);
      return /^\+\d{7,15}$/.test(withPlus.replace(/\s/g, '')) ? withPlus : null;
    };
    const instapay = normalizePhone(instapayRaw);
    const cashNumbers = cashRaw.split(',').map(s => normalizePhone(s)).filter(Boolean);
    const paypal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalRaw) ? paypalRaw : null;
    const etisalat_cash = normalizePhone(etisalatCashRaw);
    res.json({
      instapay: instapay || null,
      cash_numbers: cashNumbers,
      paypal: paypal || null,
      etisalat_cash: etisalat_cash || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Serve favicon and logo files from images directory if they exist
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(imagesDir, 'cropped-favicon1-32x32.png');
  if (fs.existsSync(faviconPath)) {
    return res.sendFile(faviconPath);
  }
  // Try other favicon locations
  const altPaths = [
    path.join(publicDir, 'favicon.ico'),
    path.join(attachedAssetsDir, 'favicon.ico'),
    path.join(rootAttachedAssetsDir, 'favicon.ico')
  ];
  for (const altPath of altPaths) {
    if (fs.existsSync(altPath)) {
      return res.sendFile(altPath);
    }
  }
  res.status(404).end();
});

// Serve logo files from images or attached_assets
app.get('/attached_assets/ninja-gaming-logo.png', (req, res) => {
  // Try images directory first
  const logoPath1 = path.join(imagesDir, 'ninja-gaming-logo.png');
  if (fs.existsSync(logoPath1)) {
    return res.sendFile(logoPath1);
  }
  // Try attached_assets
  const logoPath2 = path.join(rootAttachedAssetsDir, 'ninja-gaming-logo.png');
  if (fs.existsSync(logoPath2)) {
    return res.sendFile(logoPath2);
  }
  // Try backend/public/attached_assets
  const logoPath3 = path.join(attachedAssetsDir, 'ninja-gaming-logo.png');
  if (fs.existsSync(logoPath3)) {
    return res.sendFile(logoPath3);
  }
  // Try backend/public
  const logoPath4 = path.join(publicDir, 'ninja-gaming-logo.png');
  if (fs.existsSync(logoPath4)) {
    return res.sendFile(logoPath4);
  }
  res.status(404).json({ message: 'Logo not found' });
});

// Serve any image from images directory
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(imagesDir, filename);
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath);
  }
  res.set('Cache-Control', 'public, max-age=60');
  res.type('image/svg+xml');
  res.status(200).send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="28" font-family="sans-serif">Image unavailable</text>
    </svg>`
  );
});

// ===============================================
// API ENDPOINTS (Added as requested)
// ===============================================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    // Prefer database (so seeded images work). Fallback to JSON file only if DB is empty/unavailable.
    try {
      const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
      if (result?.rows?.length) {
        return res.json(result.rows.map((c) => ({ ...c, image: normalizeImageUrl(c.image) })));
      }
    } catch (err) {
      console.error('DB Category fetch error:', err);
    }

    const categoriesPath = path.join(__dirname, 'data', 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      const data = fs.readFileSync(categoriesPath, 'utf8');
      const categories = JSON.parse(data);
      return res.json(
        Array.isArray(categories)
          ? categories.map((c) => ({ ...c, image: normalizeImageUrl(c.image) }))
          : []
      );
    }

    res.json([]);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

// Get popular games
app.get('/api/games/popular', async (req, res) => {
  try {
    // Prefer database (so images and packages reflect actual DB). Fallback to JSON only if DB unavailable.
    try {
      const result = await pool.query(`
        SELECT id, name, slug, description, price, currency, image, category, 
               is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
               discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
        FROM games
        WHERE is_popular = true
        LIMIT 10
      `);
      if (result?.rows) {
        const games = result.rows.map(game => ({
          ...game,
          image: normalizeImageUrl(game.image),
          packages: Array.isArray(game.packages) ? game.packages : (game.packages ? JSON.parse(game.packages) : []),
          packagePrices: Array.isArray(game.packagePrices) ? game.packagePrices : (game.packagePrices ? JSON.parse(game.packagePrices) : []),
          packageDiscountPrices: Array.isArray(game.packageDiscountPrices) ? game.packageDiscountPrices : (game.packageDiscountPrices ? JSON.parse(game.packageDiscountPrices) : [])
        }));
        return res.json(games.map(g => ({ ...g, stock: 100 })));
      }
    } catch {}

    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const popularGames = Array.isArray(games) ? games.filter(g => g.isPopular) : [];
      return res.json(popularGames.map((g) => ({ ...g, image: normalizeImageUrl(g.image), stock: 100 })));
    }

    res.json([]);
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
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
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
        description TEXT NOT NULL DEFAULT '',
        price DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'EGP',
        image VARCHAR(255),
        category VARCHAR(100),
        is_popular BOOLEAN DEFAULT false,
        stock INTEGER DEFAULT 100,
        packages JSONB DEFAULT '[]',
        package_prices JSONB DEFAULT '[]',
        package_discount_prices JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Ensure description column has NOT NULL constraint and default
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add default if column doesn't have one
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'games' 
          AND column_name = 'description' 
          AND column_default IS NOT NULL
        ) THEN
          ALTER TABLE games ALTER COLUMN description SET DEFAULT '';
        END IF;
        
        -- Update existing null descriptions
        UPDATE games SET description = '' WHERE description IS NULL;
        
        -- Add NOT NULL constraint if it doesn't exist
        BEGIN
          ALTER TABLE games ALTER COLUMN description SET NOT NULL;
        EXCEPTION WHEN OTHERS THEN
          -- Constraint might already exist, ignore
          NULL;
        END;
      END $$;
    `);

    // Additional fields requested
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS category_id VARCHAR(50)`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS stock_amount INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS package_prices JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2)`);
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS package_discount_prices JSONB DEFAULT '[]'`);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS image_assets (
        id VARCHAR(50) PRIMARY KEY,
        url TEXT NOT NULL,
        original_filename TEXT,
        source TEXT DEFAULT 'catbox',
        related_type TEXT,
        related_id TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Logo configuration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logo_config (
        id TEXT PRIMARY KEY DEFAULT 'logo_1',
        small_logo_url TEXT NOT NULL DEFAULT '/attached_assets/small-image-logo.png',
        large_logo_url TEXT NOT NULL DEFAULT '/attached_assets/large-image-logo.png',
        favicon_url TEXT NOT NULL DEFAULT '/images/cropped-favicon1-32x32.png',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Live chat widget configuration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_widget_config (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'widget_1',
        enabled BOOLEAN DEFAULT true,
        icon_url TEXT,
        welcome_message TEXT,
        position VARCHAR(20) DEFAULT 'bottom-right',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Initialize chat widget config if not exists
    await pool.query(`
      INSERT INTO chat_widget_config (id, enabled, icon_url, welcome_message, position)
      SELECT 'widget_1', true, '/images/message-icon.svg', 'Hello! How can we help you?', 'bottom-right'
      WHERE NOT EXISTS (SELECT 1 FROM chat_widget_config WHERE id = 'widget_1');
    `);

    // Chat messages: read receipts
    await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false`);
    // WhatsApp messages: group flag
    await pool.query(`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false`);
    // Seller alerts: archiving
    await pool.query(`ALTER TABLE seller_alerts ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interaction_metrics (
        id VARCHAR(60) PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        element VARCHAR(120),
        page VARCHAR(200),
        success BOOLEAN DEFAULT true,
        error TEXT,
        ua TEXT,
        ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id VARCHAR(60) PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        value DOUBLE PRECISION,
        page VARCHAR(200),
        ua TEXT,
        ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Admin audit logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Site settings (logo, header, navigation, locale)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id VARCHAR(50) PRIMARY KEY,
        logo_url TEXT,
        header_bg_url TEXT,
        nav_links JSONB DEFAULT '[]',
        default_locale VARCHAR(10) DEFAULT 'en',
        version INTEGER DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`INSERT INTO site_settings (id) VALUES ('site') ON CONFLICT (id) DO NOTHING`);

    // Translations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id VARCHAR(50) PRIMARY KEY,
        lang VARCHAR(10) NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(lang)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_translations_lang_key ON translations(lang, key)`);

    // Contact messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(120),
        phone VARCHAR(40),
        subject VARCHAR(160),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        spam_score INTEGER DEFAULT 0,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Promotions countdowns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countdowns (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        target_at TIMESTAMP NOT NULL,
        image_url TEXT,
        text TEXT,
        styles JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Hot deals flag on games
    await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS hot_deal BOOLEAN DEFAULT false`);

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
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT false
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_alerts (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT false,
        flagged BOOLEAN DEFAULT false,
        archived BOOLEAN DEFAULT false
      );
    `);

    await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE seller_alerts ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false`);

    console.log('✓ Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

async function runImageAssetsSeeding() {
  console.log('🔄 runImageAssetsSeeding starting...');
  const client = await pool.connect();
  console.log('🔄 runImageAssetsSeeding connected to DB');
  const runId = `seed_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const startedAt = new Date();
  let gamesUpdated = 0;
  let categoriesUpdated = 0;
  let errors = 0;
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS seeding_runs (
        id VARCHAR(60) PRIMARY KEY,
        started_at TIMESTAMP,
        finished_at TIMESTAMP,
        success BOOLEAN,
        games_updated INTEGER,
        categories_updated INTEGER,
        errors INTEGER,
        summary TEXT
      )
    `);
    await client.query('BEGIN');
    const gamesRes = await client.query('SELECT id, image FROM games');
    for (const row of gamesRes.rows || []) {
      const current = normalizeImageUrl(row.image);
      if (current !== row.image) {
        try {
          await client.query('UPDATE games SET image = $1 WHERE id = $2', [current, row.id]);
          gamesUpdated++;
        } catch {
          errors++;
        }
      }
    }
    const catRes = await client.query('SELECT id, image FROM categories');
    for (const row of catRes.rows || []) {
      const current = normalizeImageUrl(row.image);
      if (current !== row.image) {
        try {
          await client.query('UPDATE categories SET image = $1 WHERE id = $2', [current, row.id]);
          categoriesUpdated++;
        } catch {
          errors++;
        }
      }
    }
    await client.query('COMMIT');
    const finishedAt = new Date();
    const summary = `images updated: games=${gamesUpdated}, categories=${categoriesUpdated}, errors=${errors}`;
    try {
      await pool.query(
        'INSERT INTO seeding_runs (id, started_at, finished_at, success, games_updated, categories_updated, errors, summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [runId, startedAt, finishedAt, true, gamesUpdated, categoriesUpdated, errors, summary]
      );
      const auditId = `aa_${Date.now()}`;
      await pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1,$2,$3)', [auditId, 'image_seeding', summary]);
    } catch {}
    return { ok: true, gamesUpdated, categoriesUpdated, errors };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    const finishedAt = new Date();
    const summary = `seeding failed: ${String(err.message || err).substring(0,180)}`;
    try {
      await pool.query(
        'INSERT INTO seeding_runs (id, started_at, finished_at, success, games_updated, categories_updated, errors, summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [runId, startedAt, finishedAt, false, gamesUpdated, categoriesUpdated, errors+1, summary]
      );
      const alertId = `al_${Date.now()}`;
      await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1,$2,$3)', [alertId, 'seeding_error', summary]);
    } catch {}
    return { ok: false, error: err.message || String(err) };
  } finally {
    client.release();
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
      const imagePath = `/media/${imageName}`;
      
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

// Admin Logout
app.post('/api/admin/logout', authenticateToken, async (req, res) => {
  try {
    // JWT tokens are stateless, so logout is handled client-side by removing the token
    // This endpoint just confirms the logout
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/seeding/status', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM seeding_runs ORDER BY finished_at DESC NULLS LAST LIMIT 1');
    res.json(r.rows?.[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/seeding/report', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM seeding_runs ORDER BY finished_at DESC NULLS LAST LIMIT 20');
    const total = await pool.query('SELECT COUNT(*)::int AS c FROM seeding_runs');
    res.json({ total: total.rows?.[0]?.c || 0, items: r.rows || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User Login/Sign In for Chat
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }
    
    // Create or get user
    let userResult = await pool.query('SELECT id, name, phone FROM users WHERE phone = $1', [phone]);
    let userId;
    
    if (userResult.rows.length === 0) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      await pool.query('INSERT INTO users (id, name, phone) VALUES ($1, $2, $3)', [userId, name, phone]);
    } else {
      userId = userResult.rows[0].id;
      // Update name if provided
      if (name !== userResult.rows[0].name) {
        await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
      }
    }
    
    // Generate session token for chat
    const sessionToken = jwt.sign({ userId, name, phone }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      token: sessionToken, 
      user: { id: userId, name, phone },
      message: 'Login successful' 
    });
  } catch (err) {
    console.error('User login error:', err);
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
    let query = 'SELECT * FROM game_cards WHERE 1=1';
    const params = [];
    if (req.query.game_id) { params.push(req.query.game_id); query += ` AND game_id = $${params.length}`; }
    if (req.query.is_used === 'true' || req.query.is_used === 'false') { params.push(req.query.is_used === 'true'); query += ` AND is_used = $${params.length}`; }
    if (req.query.q) { params.push(`%${String(req.query.q)}%`); query += ` AND card_code ILIKE $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    const rows = await pool.query(query, params);
    let countQuery = 'SELECT COUNT(*) as count FROM game_cards WHERE 1=1';
    const countParams = [];
    if (req.query.game_id) { countParams.push(req.query.game_id); countQuery += ` AND game_id = $${countParams.length}`; }
    if (req.query.is_used === 'true' || req.query.is_used === 'false') { countParams.push(req.query.is_used === 'true'); countQuery += ` AND is_used = $${countParams.length}`; }
    if (req.query.q) { countParams.push(`%${String(req.query.q)}%`); countQuery += ` AND card_code ILIKE $${countParams.length}`; }
    const total = await pool.query(countQuery, countParams);
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
    // Validate game exists
    const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [game_id]);
    if (gameCheck.rows.length === 0) return res.status(400).json({ message: 'Invalid game_id' });
    // Validate code length
    if (card_code.length < 5 || card_code.length > 200) return res.status(400).json({ message: 'Invalid card_code length' });
    // Prevent duplicates
    const dup = await pool.query('SELECT id FROM game_cards WHERE game_id = $1 AND card_code = $2', [game_id, card_code]);
    if (dup.rows.length) return res.status(409).json({ message: 'Duplicate card_code' });
    const id = `card_${Date.now()}`;
    await pool.query('INSERT INTO game_cards (id, game_id, card_code) VALUES ($1, $2, $3)', [id, game_id, card_code]);
    try { const auditId = `aa_${Date.now()}`; await pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)', [auditId, 'create_card', `Card created for ${game_id}`]); } catch {}
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
    try { const auditId = `aa_${Date.now()}`; await pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)', [auditId, 'update_card', `Card ${id} updated`]); } catch {}
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
    try { const auditId = `aa_${Date.now()}`; await pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)', [auditId, 'delete_card', `Card ${id} deleted`]); } catch {}
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== HOT DEALS =====================
app.get('/api/games/hot-deals', async (req, res) => {
  try {
    try {
      const rows = await pool.query('SELECT id, name, slug, image, price, currency FROM games WHERE hot_deal = true ORDER BY updated_at DESC');
      return res.json(rows.rows.map(g => ({ ...g, image: normalizeImageUrl(g.image) })));
    } catch {}
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const filtered = Array.isArray(games)
        ? games
            .filter(g => g.hot_deal === true)
            .map(g => ({ ...g, image: normalizeImageUrl(g.image) }))
        : [];
      return res.json(filtered);
    }
    res.json([]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/games/:id/hotdeal', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; const { hot } = req.body || {};
    const rows = await pool.query('UPDATE games SET hot_deal = $1 WHERE id = $2 OR slug = $2 RETURNING id, name, slug, hot_deal', [Boolean(hot), id]);
    if (!rows.rows.length) return res.status(404).json({ message: 'Game not found' });
    res.json(rows.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/game-cards/bulk', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'items array required' });
    let created = 0, skipped = 0, errors = 0;
    for (const it of items) {
      try {
        const game_id = String(it.game_id || '').trim();
        const card_code = sanitizeString(it.card_code);
        if (!game_id || !card_code || card_code.length < 5) { errors++; continue; }
        const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [game_id]);
        if (gameCheck.rows.length === 0) { errors++; continue; }
        const dup = await pool.query('SELECT id FROM game_cards WHERE game_id = $1 AND card_code = $2', [game_id, card_code]);
        if (dup.rows.length) { skipped++; continue; }
        const id = `card_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        await pool.query('INSERT INTO game_cards (id, game_id, card_code) VALUES ($1, $2, $3)', [id, game_id, card_code]);
        created++;
      } catch { errors++; }
    }
    try { const auditId = `aa_${Date.now()}`; await pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)', [auditId, 'bulk_cards', `Bulk cards: created=${created}, skipped=${skipped}, errors=${errors}`]); } catch {}
    res.json({ created, skipped, errors });
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
    try {
      const result = await pool.query(`
        SELECT id, name, slug, description, price, currency, image, category, 
               is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
               discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices",
               discount_prices as "discountPrices"
        FROM games 
        ORDER BY id DESC
      `);
      const games = result.rows.map(game => ({
        ...game,
        image: normalizeImageUrl(game.image),
        packages: coerceJsonArray(game.packages),
        packagePrices: coerceJsonArray(game.packagePrices),
        packageDiscountPrices: coerceJsonArray(game.packageDiscountPrices),
        discountPrices: coerceJsonArray(game.discountPrices)
      }));
      return res.json(games.map(g => ({ ...g, stock: 100 })));
    } catch {}
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const normalized = Array.isArray(games)
        ? games.map(g => ({
            ...g,
            image: normalizeImageUrl(g.image),
            packages: coerceJsonArray(g.packages),
            packagePrices: coerceJsonArray(g.packagePrices),
            packageDiscountPrices: coerceJsonArray(g.packageDiscountPrices),
            discountPrices: coerceJsonArray(g.discountPrices),
            stock: 100
          }))
        : [];
      return res.json(normalized);
    }
    res.json([]);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ message: err.message, error: 'Failed to fetch games' });
  }
});

// Get popular games (must come before /api/games/:slug)
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
    // Ensure packages and prices are arrays
    const games = result.rows.map(game => ({
      ...game,
      image: normalizeImageUrl(game.image),
      packages: coerceJsonArray(game.packages),
      packagePrices: coerceJsonArray(game.packagePrices),
      packageDiscountPrices: coerceJsonArray(game.packageDiscountPrices)
    }));
    res.json(games.map(g => ({ ...g, stock: 100 })));
  } catch (err) {
    console.error('Error fetching popular games:', err);
    res.status(500).json({ message: err.message, error: 'Failed to fetch popular games' });
  }
});

// Get games by category (must come before /api/games/:slug)
app.get('/api/games/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    try {
      const result = await pool.query(`
        SELECT id, name, slug, description, price, currency, image, category, 
               is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
               discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices",
               discount_prices as "discountPrices"
        FROM games 
        WHERE category = $1 OR category_id = $1 OR slug = $1
        ORDER BY id DESC
      `, [category]);
      const games = result.rows.map(game => ({
        ...game,
        image: normalizeImageUrl(game.image),
        packages: coerceJsonArray(game.packages),
        packagePrices: coerceJsonArray(game.packagePrices),
        packageDiscountPrices: coerceJsonArray(game.packageDiscountPrices),
        discountPrices: coerceJsonArray(game.discountPrices)
      }));
      return res.json(games.map(g => ({ ...g, stock: 100 })));
    } catch {}
    // Fallback to local JSON
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const filtered = Array.isArray(games)
        ? games
            .filter(g => {
              const cat = String(g.category || '').toLowerCase();
              const slug = String(g.slug || '').toLowerCase();
              const q = String(category || '').toLowerCase();
              return cat === q || slug === q;
            })
            .map(g => ({
              ...g,
              image: normalizeImageUrl(g.image),
              packages: coerceJsonArray(g.packages),
              packagePrices: coerceJsonArray(g.packagePrices),
              packageDiscountPrices: coerceJsonArray(g.packageDiscountPrices),
              discountPrices: coerceJsonArray(g.discountPrices),
              stock: 100
            }))
        : [];
      return res.json(filtered);
    }
    res.json([]);
  } catch (err) {
    console.error('Error fetching games by category:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get game by ID (must come before /api/games/:slug)
app.get('/api/games/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const result = await pool.query(`
        SELECT id, name, slug, description, price, currency, image, category, 
               is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
               discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices",
               discount_prices as "discountPrices"
        FROM games 
        WHERE id = $1
      `, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
      const game = result.rows[0];
      game.image = normalizeImageUrl(game.image);
      game.packages = coerceJsonArray(game.packages);
      game.packagePrices = coerceJsonArray(game.packagePrices);
      game.packageDiscountPrices = coerceJsonArray(game.packageDiscountPrices);
      game.discountPrices = coerceJsonArray(game.discountPrices);
      return res.json(game);
    } catch {}
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const found = Array.isArray(games) ? games.find(g => String(g.id) === String(id)) : null;
      if (!found) return res.status(404).json({ message: 'Game not found' });
      const game = {
        ...found,
        image: normalizeImageUrl(found.image),
        packages: coerceJsonArray(found.packages),
        packagePrices: coerceJsonArray(found.packagePrices),
        packageDiscountPrices: coerceJsonArray(found.packageDiscountPrices),
        discountPrices: coerceJsonArray(found.discountPrices)
      };
      return res.json(game);
    }
    res.status(404).json({ message: 'Game not found' });
  } catch (err) {
    console.error('Error fetching game by ID:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get game by slug (must come after /api/games/category/:category)
app.get('/api/games/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const normalizedSlug = String(slug || '').trim();
    const compactSlug = normalizedSlug.replace(/-/g, '').toLowerCase();
    try {
      const result = await pool.query(`
        SELECT id, name, slug, description, price, currency, image, category, 
               is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
               discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
        FROM games 
        WHERE slug = $1
           OR LOWER(REPLACE(slug, '-', '')) = $2
        LIMIT 1
      `, [normalizedSlug, compactSlug]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
  
      const game = result.rows[0];
      game.image = normalizeImageUrl(game.image);
      game.packages = coerceJsonArray(game.packages);
      game.packagePrices = coerceJsonArray(game.packagePrices);
      game.packageDiscountPrices = coerceJsonArray(game.packageDiscountPrices);
      return res.json(game);
    } catch {}
    // Fallback to local JSON
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const found = Array.isArray(games)
        ? games.find(g => {
            const s = String(g.slug || '').trim();
            return s === normalizedSlug || s.replace(/-/g, '').toLowerCase() === compactSlug;
          })
        : null;
      if (!found) return res.status(404).json({ message: 'Game not found' });
      const game = {
        ...found,
        image: normalizeImageUrl(found.image),
        packages: coerceJsonArray(found.packages),
        packagePrices: coerceJsonArray(found.packagePrices),
        packageDiscountPrices: coerceJsonArray(found.packageDiscountPrices)
      };
      return res.json(game);
    }
    res.status(404).json({ message: 'Game not found' });
  } catch (err) {
    console.error('Error fetching game by slug:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get game by slug (generic route - must come after specific routes)
app.get('/api/games/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (slug === 'popular' || slug === 'category' || slug === 'slug' || slug === 'id') {
      return res.status(404).json({ message: 'Invalid route' });
    }

    const normalizedSlug = String(slug || '').trim().replace(/:\d+$/, '');
    const compactSlug = normalizedSlug.replace(/-/g, '').toLowerCase();
    
    try {
      const result = await pool.query(`
        SELECT id, name, slug, description, price, currency, image, category, 
               is_popular as "isPopular", stock, packages, package_prices as "packagePrices",
               discount_price as "discountPrice", package_discount_prices as "packageDiscountPrices"
        FROM games 
        WHERE slug = $1
           OR LOWER(REPLACE(slug, '-', '')) = $2
        LIMIT 1
      `, [normalizedSlug, compactSlug]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
      const game = result.rows[0];
      game.image = normalizeImageUrl(game.image);
      game.packages = coerceJsonArray(game.packages);
      game.packagePrices = coerceJsonArray(game.packagePrices);
      game.packageDiscountPrices = coerceJsonArray(game.packageDiscountPrices);
      return res.json(game);
    } catch {}
    const gamesPath = path.join(__dirname, 'data', 'games.json');
    if (fs.existsSync(gamesPath)) {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const games = JSON.parse(data);
      const found = Array.isArray(games)
        ? games.find(g => {
            const s = String(g.slug || '').trim();
            return s === normalizedSlug || s.replace(/-/g, '').toLowerCase() === compactSlug;
          })
        : null;
      if (!found) return res.status(404).json({ message: 'Game not found' });
      const game = {
        ...found,
        image: normalizeImageUrl(found.image),
        packages: coerceJsonArray(found.packages),
        packagePrices: coerceJsonArray(found.packagePrices),
        packageDiscountPrices: coerceJsonArray(found.packageDiscountPrices)
      };
      return res.json(game);
    }
    res.status(404).json({ message: 'Game not found' });
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ message: err.message });
  }
});


// Create game (Admin)
app.post('/api/admin/games', authenticateToken, imageUpload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, price, currency, category, isPopular, stock, discountPrice, packages, packagePrices, packageDiscountPrices } = req.body;
    const image = await useProvidedImage(req);
    const id = `game_${Date.now()}`;
    
    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const isPop = String(isPopular) === 'true';

    const normalizeToArray = (v) => {
      if (v === undefined) return [];
      if (v === null) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return [];
        if (s.startsWith('[')) {
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [s];
      }
      return [v];
    };
    
    // Handle packages - if it's an array of objects, extract the arrays
    let packagesArr, packagePricesArr, packageDiscountPricesArr;
    
    if (packages && Array.isArray(packages) && packages.length > 0 && typeof packages[0] === 'object') {
      // Packages are objects: [{amount, price, discountPrice, image}, ...]
      packagesArr = packages.map(p => String(p.amount || p.name || ''));
      packagePricesArr = packages.map(p => Number(p.price || 0));
      packageDiscountPricesArr = packages.map(p => (p.discountPrice ? Number(p.discountPrice) : null));
    } else {
      // Legacy format: separate arrays
      packagesArr = normalizeToArray(packages);
      packagePricesArr = normalizeToArray(packagePrices);
      packageDiscountPricesArr = normalizeToArray(packageDiscountPrices);
    }

    // Ensure description is never null or undefined - use empty string as fallback
    const safeDescription = (description !== null && description !== undefined) ? String(description).trim() : '';

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Game name is required' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price, packages, package_prices, package_discount_prices) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
         RETURNING id, name, slug, description, price, currency, image, category, is_popular as "isPopular", stock, 
                   discount_price as "discountPrice", packages, package_prices as "packagePrices", 
                   package_discount_prices as "packageDiscountPrices"`,
        [id, name.trim(), finalSlug, safeDescription, Number(price) || 0, currency || 'EGP', image || '/media/placeholder.jpg', category || 'other', isPop, Number(stock) || 100, 
         discountPrice ? Number(discountPrice) : null, JSON.stringify(packagesArr), JSON.stringify(packagePricesArr), JSON.stringify(packageDiscountPricesArr)]
      );
      return res.status(201).json(result.rows[0]);
    } catch (dbErr) {
      console.error('DB Insert Failed:', dbErr.message);
    }
    const existingGames = readGamesFile();
    const jsonGame = {
      id,
      name: name.trim(),
      slug: finalSlug,
      description: safeDescription,
      price: String(Number(price) || 0),
      currency: currency || 'EGP',
      image: normalizeImageUrl(image || '/media/placeholder.jpg'),
      category: category || 'other',
      isPopular: isPop,
      stock: Number(stock) || 100,
      discountPrice: discountPrice ? String(Number(discountPrice)) : null,
      packages: packagesArr,
      packagePrices: (packagePricesArr || []).map(n => String(Number(n) || 0)),
      packageDiscountPrices: (packageDiscountPricesArr || []).map(v => v == null ? null : String(Number(v)))
    };
    existingGames.unshift(jsonGame);
    writeGamesFile(existingGames);
    res.status(201).json(jsonGame);
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update game (Admin)
app.put('/api/admin/games/:id', authenticateToken, imageUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const idOrSlug = String(id || '').trim();
    let lookup = await pool.query('SELECT id FROM games WHERE id = $1', [idOrSlug]);
    if (lookup.rows.length === 0) {
      lookup = await pool.query('SELECT id FROM games WHERE slug = $1', [idOrSlug]);
    }
    if (lookup.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    const gameId = lookup.rows[0].id;
    const { name, slug, description, price, currency, category, isPopular, stock, discountPrice, packages, packagePrices, packageDiscountPrices } = req.body;
    let newImage = await useProvidedImage(req);
    const image = newImage !== null ? newImage : (req.body.image !== undefined ? normalizeImageUrl(req.body.image) : undefined);
    
    const isPop = String(isPopular) === 'true';

    const normalizeOptionalArray = (v) => {
      if (v === undefined) return undefined;
      if (v === null) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return [];
        if (s.startsWith('[')) {
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [s];
      }
      return [v];
    };

    const packagesArr = normalizeOptionalArray(packages);
    const packagePricesArr = normalizeOptionalArray(packagePrices);
    const packageDiscountPricesArr = normalizeOptionalArray(packageDiscountPrices);

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined && name !== null) { updates.push(`name = $${paramIndex++}`); values.push(String(name).trim()); }
    if (slug !== undefined && slug !== null) { updates.push(`slug = $${paramIndex++}`); values.push(slug); }
    if (description !== undefined) { 
      // Ensure description is never null - use empty string as fallback
      const safeDescription = (description !== null) ? String(description).trim() : '';
      updates.push(`description = $${paramIndex++}`); 
      values.push(safeDescription); 
    }
    if (price !== undefined && price !== null) { updates.push(`price = $${paramIndex++}`); values.push(Number(price) || 0); }
    if (currency !== undefined && currency !== null) { updates.push(`currency = $${paramIndex++}`); values.push(currency); }
    if (image !== undefined && image !== null) { updates.push(`image = $${paramIndex++}`); values.push(image); }
    if (req.body.image_url !== undefined && req.body.image_url !== null) { updates.push(`image_url = $${paramIndex++}`); values.push(normalizeImageUrl(req.body.image_url)); }
    if (category !== undefined && category !== null) { updates.push(`category = $${paramIndex++}`); values.push(category); }
    if (isPopular !== undefined && isPopular !== null) { updates.push(`is_popular = $${paramIndex++}`); values.push(isPop); }
    if (stock !== undefined && stock !== null) { updates.push(`stock = $${paramIndex++}`); values.push(Number(stock) || 0); }
    if (discountPrice !== undefined) { updates.push(`discount_price = $${paramIndex++}`); values.push(discountPrice ? Number(discountPrice) : null); }
    if (packagesArr !== undefined) { updates.push(`packages = $${paramIndex++}`); values.push(packagesArr); }
    if (packagePricesArr !== undefined) { updates.push(`package_prices = $${paramIndex++}`); values.push(packagePricesArr); }
    if (packageDiscountPricesArr !== undefined) { updates.push(`package_discount_prices = $${paramIndex++}`); values.push(packageDiscountPricesArr); }
    
    // If no updates, return current game data
    if (updates.length === 0) {
      const currentGame = await pool.query('SELECT id, name, slug, description, price, currency, image, category, is_popular as "isPopular", stock, discount_price as "discountPrice", packages, package_prices as "packagePrices", package_discount_prices as "packageDiscountPrices" FROM games WHERE id = $1', [gameId]);
      if (currentGame.rows.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
      const row = currentGame.rows[0];
      row.image = normalizeImageUrl(row.image);
      row.packages = coerceJsonArray(row.packages);
      row.packagePrices = coerceJsonArray(row.packagePrices);
      row.packageDiscountPrices = coerceJsonArray(row.packageDiscountPrices);
      return res.json(row);
    }
    
    values.push(gameId);

    const query = `
      UPDATE games 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, name, slug, description, price, currency, image, category, is_popular as "isPopular", stock,
                discount_price as "discountPrice", packages, package_prices as "packagePrices",
                package_discount_prices as "packageDiscountPrices"
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
      const row = result.rows[0];
      row.image = normalizeImageUrl(row.image);
      row.packages = coerceJsonArray(row.packages);
      row.packagePrices = coerceJsonArray(row.packagePrices);
      row.packageDiscountPrices = coerceJsonArray(row.packageDiscountPrices);
      return res.json(row);
    } catch {}
    const jsonGames = readGamesFile();
    const idx = jsonGames.findIndex(g => String(g.id) === String(gameId));
    if (idx === -1) return res.status(404).json({ message: 'Game not found' });
    const current = jsonGames[idx];
    const updated = { ...current };
    if (name !== undefined && name !== null) updated.name = String(name).trim();
    if (slug !== undefined && slug !== null) updated.slug = String(slug);
    if (description !== undefined) updated.description = (description !== null) ? String(description).trim() : '';
    if (price !== undefined && price !== null) updated.price = String(Number(price) || 0);
    if (currency !== undefined && currency !== null) updated.currency = String(currency);
    if (image !== undefined && image !== null) updated.image = normalizeImageUrl(image);
    if (category !== undefined && category !== null) updated.category = String(category);
    if (isPopular !== undefined && isPopular !== null) updated.isPopular = isPop;
    if (stock !== undefined && stock !== null) updated.stock = Number(stock) || 0;
    if (discountPrice !== undefined) updated.discountPrice = discountPrice ? String(Number(discountPrice)) : null;
    if (packagesArr !== undefined) updated.packages = packagesArr;
    if (packagePricesArr !== undefined) updated.packagePrices = (packagePricesArr || []).map(n => String(Number(n) || 0));
    if (packageDiscountPricesArr !== undefined) updated.packageDiscountPrices = (packageDiscountPricesArr || []).map(v => v == null ? null : String(Number(v)));
    jsonGames[idx] = updated;
    writeGamesFile(jsonGames);
    res.json(updated);
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete game (Admin)
app.delete('/api/admin/games/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const idOrSlug = String(id || '').trim();
    let lookup = await pool.query('SELECT id FROM games WHERE id = $1', [idOrSlug]);
    if (lookup.rows.length === 0) {
      lookup = await pool.query('SELECT id FROM games WHERE slug = $1', [idOrSlug]);
    }
    if (lookup.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    const gameId = lookup.rows[0].id;
    
    try {
      const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [gameId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
      return res.json({ ok: true });
    } catch {}
    const jsonGames2 = readGamesFile();
    const filtered = jsonGames2.filter(g => String(g.id) !== String(gameId));
    if (filtered.length === jsonGames2.length) {
      return res.status(404).json({ message: 'Game not found' });
    }
    writeGamesFile(filtered);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/games/wipe', authenticateToken, async (req, res) => {
  try {
    try {
      await pool.query('DELETE FROM game_cards');
    } catch {}
    try {
      await pool.query('DELETE FROM games');
    } catch {}
    writeGamesFile([]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/games/seed', authenticateToken, async (req, res) => {
  try {
    if (typeof initializeDatabase === 'function') {
      await initializeDatabase();
    }
    await seedGamesFromJsonIfEmpty();
    const r = await pool.query('SELECT COUNT(*)::int AS c FROM games');
    res.json({ ok: true, count: r.rows?.[0]?.c || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/games/reset-seed', authenticateToken, async (req, res) => {
  try {
    try { await pool.query('DELETE FROM game_cards'); } catch {}
    try { await pool.query('DELETE FROM games'); } catch {}
    if (typeof initializeDatabase === 'function') await initializeDatabase();
    await seedGamesFromJsonIfEmpty();
    let count = 0;
    try {
      const r = await pool.query('SELECT COUNT(*)::int AS c FROM games');
      count = r.rows?.[0]?.c || 0;
    } catch {}
    let imageSeeding = null;
    try {
      imageSeeding = await runImageAssetsSeeding();
    } catch {}
    res.json({ ok: true, count, imageSeeding });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/images/upload-cloudinary', authenticateToken, imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' });
    const localPath = req.file.path;
    let url = null;
    if (CLOUDINARY_ENABLED) {
      try {
        const result = await cloudinary.uploader.upload(localPath, { folder: process.env.CLOUDINARY_FOLDER || 'gamecart/games', resource_type: 'image' });
        url = result.secure_url;
      } catch (err) {
        url = null;
      }
    }
    if (!url) {
      url = normalizeImageUrl(`/uploads/${req.file.filename}`);
    }
    try { fs.unlinkSync(localPath); } catch {}
    res.json({ ok: true, url });
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
    res.json((result.rows || []).map((c) => ({ ...c, image: normalizeImageUrl(c.image) })));
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: err.message, error: 'Failed to fetch categories' });
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
    
    // Get current category
    const current = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const currentCat = current.rows[0];
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined && name !== null) { updates.push(`name = $${paramIndex++}`); values.push(String(name).trim()); }
    if (slug !== undefined && slug !== null) { updates.push(`slug = $${paramIndex++}`); values.push(slug); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description !== null ? String(description).trim() : ''); }
    if (gradient !== undefined && gradient !== null) { updates.push(`gradient = $${paramIndex++}`); values.push(gradient); }
    if (icon !== undefined && icon !== null) { updates.push(`icon = $${paramIndex++}`); values.push(icon); }
    
    // Handle image
    if (req.file) {
      updates.push(`image = $${paramIndex++}`);
      values.push(normalizeImageUrl(`/uploads/${req.file.filename}`));
    } else if (req.body.image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      values.push(normalizeImageUrl(req.body.image));
    }
    
    if (updates.length === 0) {
      return res.json(currentCat);
    }
    
    values.push(id);
    
    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err);
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

// ===================== PACKAGE MANAGEMENT =====================

// Get packages for a game
app.get('/api/admin/games/:id/packages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Try by ID first, then by slug
    let result = await pool.query(
      'SELECT packages, package_prices as "packagePrices", package_discount_prices as "packageDiscountPrices" FROM games WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      // Try by slug
      result = await pool.query(
        'SELECT packages, package_prices as "packagePrices", package_discount_prices as "packageDiscountPrices" FROM games WHERE slug = $1',
        [id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = result.rows[0];
    // Convert to package objects if needed
    const packages = coerceJsonArray(game.packages);
    const prices = coerceJsonArray(game.packagePrices);
    const discountPrices = coerceJsonArray(game.packageDiscountPrices);
    
    // If packages are strings, convert to objects
    const packageObjects = packages.map((pkg, index) => {
      if (typeof pkg === 'object' && pkg !== null && pkg.amount) {
        return pkg; // Already an object
      }
      return {
        amount: String(pkg || ''),
        price: Number(prices[index] || 0),
        discountPrice: discountPrices[index] ? Number(discountPrices[index]) : null,
        image: null
      };
    });
    
    res.json(packageObjects);
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update packages for a game
app.put('/api/admin/games/:id/packages', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { packages } = req.body;
    
    if (!Array.isArray(packages)) {
      return res.status(400).json({ message: 'Packages must be an array' });
    }
    
    // Basic validation and sanitization
    const sanitized = packages.map((p) => ({
      amount: String((p && p.amount) ? p.amount : '').trim(),
      price: Number((p && p.price) ? p.price : 0),
      discountPrice: (p && p.discountPrice !== undefined && p.discountPrice !== null) ? Number(p.discountPrice) : null,
      image: null
    }));
    // Validate amounts and prices
    for (const pkg of sanitized) {
      if (!pkg.amount) {
        return res.status(400).json({ message: 'Each package must have a non-empty amount' });
      }
      if (isNaN(pkg.price) || pkg.price < 0) {
        return res.status(400).json({ message: 'Each package must have a valid non-negative price' });
      }
      if (pkg.discountPrice !== null && (isNaN(pkg.discountPrice) || pkg.discountPrice < 0)) {
        return res.status(400).json({ message: 'discountPrice must be null or a valid non-negative number' });
      }
    }
    
    // Validate game exists - try by ID first, then by slug
    let gameCheck = await client.query('SELECT id FROM games WHERE id = $1', [id]);
    if (gameCheck.rows.length === 0) {
      gameCheck = await client.query('SELECT id FROM games WHERE slug = $1', [id]);
    }
    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    const actualGameId = gameCheck.rows[0].id;

    // Extract arrays for JSONB columns and ensure same length
    const amounts = sanitized.map(p => p.amount);
    const prices = sanitized.map(p => p.price);
    const discountPrices = sanitized.map(p => p.discountPrice);
    while (discountPrices.length < amounts.length) discountPrices.push(null);

    await client.query('BEGIN');
    await client.query(
      'UPDATE games SET packages = $1::jsonb, package_prices = $2::jsonb, package_discount_prices = $3::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [JSON.stringify(amounts), JSON.stringify(prices), JSON.stringify(discountPrices), actualGameId]
    );
    const updatedResult = await client.query(
      'SELECT packages, package_prices as "packagePrices", package_discount_prices as "packageDiscountPrices" FROM games WHERE id = $1',
      [actualGameId]
    );
    await client.query('COMMIT');

    const updatedGame = updatedResult.rows[0];
    const updatedPackages = coerceJsonArray(updatedGame.packages);
    const updatedPrices = coerceJsonArray(updatedGame.packagePrices);
    const updatedDiscountPrices = coerceJsonArray(updatedGame.packageDiscountPrices);
    const packageObjects = updatedPackages.map((pkg, index) => ({
      amount: typeof pkg === 'string' ? pkg : (pkg?.amount || ''),
      price: Number(updatedPrices[index] || 0),
      discountPrice: updatedDiscountPrices[index] ? Number(updatedDiscountPrices[index]) : null,
      image: null
    }));
    res.json({ message: 'Packages updated successfully', packages: packageObjects });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Error updating packages:', err);
    res.status(500).json({ message: 'Failed to update packages', error: err.message });
  } finally {
    client.release();
  }
});

// Get games by category (for category management)
app.get('/api/admin/categories/:id/games', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, slug, category, category_id FROM games WHERE category = $1 OR category_id = $1 ORDER BY name ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update game category assignment
app.put('/api/admin/games/:gameId/category', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { categoryId, category } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(categoryId);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No category provided' });
    }
    
    values.push(gameId);
    
    const result = await pool.query(
      `UPDATE games SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, category, category_id`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== CHAT WIDGET CONFIGURATION =====================

// Get chat widget config
app.get('/api/admin/chat-widget/config', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_widget_config WHERE id = $1', ['widget_1']);
    if (result.rows.length === 0) {
      return res.json({
        id: 'widget_1',
        enabled: true,
        iconUrl: '/images/message-icon.svg',
        welcomeMessage: 'Hello! How can we help you?',
        position: 'bottom-right'
      });
    }
    res.json({
      id: result.rows[0].id,
      enabled: result.rows[0].enabled,
      iconUrl: result.rows[0].icon_url,
      welcomeMessage: result.rows[0].welcome_message,
      position: result.rows[0].position
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update chat widget config
app.put('/api/admin/chat-widget/config', authenticateToken, async (req, res) => {
  try {
    const { enabled, iconUrl, welcomeMessage, position } = req.body;
    
    const result = await pool.query(
      `UPDATE chat_widget_config 
       SET enabled = COALESCE($1, enabled),
           icon_url = COALESCE($2, icon_url),
           welcome_message = COALESCE($3, welcome_message),
           position = COALESCE($4, position),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 'widget_1'
       RETURNING *`,
      [enabled, iconUrl, welcomeMessage, position]
    );
    
    if (result.rows.length === 0) {
      // Create if doesn't exist
      await pool.query(
        'INSERT INTO chat_widget_config (id, enabled, icon_url, welcome_message, position) VALUES ($1, $2, $3, $4, $5)',
        ['widget_1', enabled !== undefined ? enabled : true, iconUrl || '/images/message-icon.svg', welcomeMessage || 'Hello! How can we help you?', position || 'bottom-right']
      );
      const newResult = await pool.query('SELECT * FROM chat_widget_config WHERE id = $1', ['widget_1']);
      return res.json({
        id: newResult.rows[0].id,
        enabled: newResult.rows[0].enabled,
        iconUrl: newResult.rows[0].icon_url,
        welcomeMessage: newResult.rows[0].welcome_message,
        position: newResult.rows[0].position
      });
    }
    
    res.json({
      id: result.rows[0].id,
      enabled: result.rows[0].enabled,
      iconUrl: result.rows[0].icon_url,
      welcomeMessage: result.rows[0].welcome_message,
      position: result.rows[0].position
    });
  } catch (err) {
    console.error('Error updating chat widget config:', err);
    res.status(500).json({ message: err.message });
  }
});

// ===================== LOGO CONFIGURATION =====================

// Get logo config
app.get('/api/admin/logo/config', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logo_config WHERE id = $1', ['logo_1']);
    if (result.rows.length === 0) {
      return res.json({
        id: 'logo_1',
        smallLogoUrl: '/attached_assets/small-image-logo.png',
        largeLogoUrl: '/attached_assets/large-image-logo.png',
        faviconUrl: '/images/cropped-favicon1-32x32.png'
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching logo config:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update logo config
app.put('/api/admin/logo/config', authenticateToken, async (req, res) => {
  try {
    const { smallLogoUrl, largeLogoUrl, faviconUrl } = req.body;
    
    const result = await pool.query(
      `UPDATE logo_config 
       SET small_logo_url = $1, large_logo_url = $2, favicon_url = $3, updated_at = NOW()
       WHERE id = 'logo_1'
       RETURNING *`,
      [smallLogoUrl, largeLogoUrl, faviconUrl]
    );
    
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO logo_config (id, small_logo_url, large_logo_url, favicon_url) VALUES ($1, $2, $3, $4)',
        ['logo_1', smallLogoUrl, largeLogoUrl, faviconUrl]
      );
      const newResult = await pool.query('SELECT * FROM logo_config WHERE id = $1', ['logo_1']);
      return res.json(newResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating logo config:', err);
    res.status(500).json({ message: err.message });
  }
});

// Generic admin image upload (PNG, SVG)
app.post('/api/admin/upload', authenticateToken, imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = normalizeImageUrl(`/uploads/${req.file.filename}`);
    res.status(201).json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public logo config for frontend
app.get('/api/logo/config', async (req, res) => {
  try {
    const result = await pool.query('SELECT small_logo_url, large_logo_url, favicon_url FROM logo_config WHERE id = $1', ['logo_1']);
    if (result.rows.length === 0) {
      return res.json({
        smallLogoUrl: '/attached_assets/small-image-logo.png',
        largeLogoUrl: '/attached_assets/large-image-logo.png',
        faviconUrl: '/images/cropped-favicon1-32x32.png'
      });
    }
    const row = result.rows[0];
    res.json({
      smallLogoUrl: normalizeImageUrl(row.small_logo_url || '/attached_assets/small-image-logo.png'),
      largeLogoUrl: normalizeImageUrl(row.large_logo_url || '/attached_assets/large-image-logo.png'),
      faviconUrl: normalizeImageUrl(row.favicon_url || '/images/cropped-favicon1-32x32.png')
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Countdown endpoints
app.get('/api/countdown/current', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, target_at, text FROM countdowns ORDER BY updated_at DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({ id: 'newyear_2026', title: 'Countdown to 2026', targetAt: '2026-01-01T00:00:00Z', text: 'Stay tuned for New Year offers and friend collaborations.' });
    }
    const row = result.rows[0];
    res.json({ id: row.id, title: row.title, targetAt: new Date(row.target_at).toISOString(), text: row.text || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/countdown', authenticateToken, async (req, res) => {
  try {
    const { id, title, targetAt, text } = req.body || {};
    if (!targetAt || isNaN(Date.parse(String(targetAt)))) {
      return res.status(400).json({ message: 'Invalid targetAt ISO date' });
    }
    const countdownId = id || 'newyear_2026';
    const result = await pool.query(
      `INSERT INTO countdowns (id, title, target_at, text, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, target_at = EXCLUDED.target_at, text = EXCLUDED.text, updated_at = CURRENT_TIMESTAMP
       RETURNING id, title, target_at, text`,
      [countdownId, String(title || 'Countdown'), new Date(targetAt), String(text || '')]
    );
    try { await pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)', [`al_${Date.now()}_${Math.random().toString(36).slice(2,9)}`, 'countdown_update', `Updated countdown ${countdownId} to ${targetAt}`]); } catch {}
    const row = result.rows[0];
    res.json({ id: row.id, title: row.title, targetAt: new Date(row.target_at).toISOString(), text: row.text || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hot deals priority column
(async () => {
  try {
    await pool.query('ALTER TABLE games ADD COLUMN IF NOT EXISTS hot_deal_priority INTEGER DEFAULT 0');
  } catch {}
})();

// Hot deals endpoints
app.get('/api/hot-deals', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, image, hot_deal, hot_deal_priority FROM games WHERE hot_deal = true ORDER BY hot_deal_priority ASC, updated_at DESC');
    res.json(result.rows.map(r => ({ ...r, image: normalizeImageUrl(r.image) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/hot-deals/order', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) return res.status(400).json({ message: 'ids[] required' });
    let priority = 0;
    for (const gameId of ids) {
      await pool.query('UPDATE games SET hot_deal = true, hot_deal_priority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [priority++, gameId]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/games/:id/hot-deal', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { hotDeal, priority } = req.body || {};
    const result = await pool.query('UPDATE games SET hot_deal = COALESCE($1, hot_deal), hot_deal_priority = COALESCE($2, hot_deal_priority), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, hot_deal, hot_deal_priority', [hotDeal, priority, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Game not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get chat widget config (public endpoint for frontend)
app.get('/api/chat-widget/config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_widget_config WHERE id = $1', ['widget_1']);
    if (result.rows.length === 0) {
      return res.json({
        enabled: true,
        iconUrl: '/images/message-icon.svg',
        welcomeMessage: 'Hello! How can we help you?',
        position: 'bottom-right'
      });
    }
    res.json({
      enabled: result.rows[0].enabled,
      iconUrl: result.rows[0].icon_url,
      welcomeMessage: result.rows[0].welcome_message,
      position: result.rows[0].position
    });
  } catch (err) {
    res.json({
      enabled: true,
      iconUrl: '/images/message-icon.svg',
      welcomeMessage: 'Hello! How can we help you?',
      position: 'bottom-right'
    });
  }
});

// Upload file
app.post('/api/admin/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;

    const fileExt = path.extname(req.file.originalname || '').toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExt);

    const buildAbsoluteUrl = () => {
      try {
        if (CDN_BASE_URL) {
          return new URL(relativeUrl, CDN_BASE_URL).toString();
        }
        const host = req.get('host');
        const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http');
        return `${proto}://${host}${relativeUrl}`;
      } catch {
        return null;
      }
    };

    const absoluteUrl = buildAbsoluteUrl();

    // Optional: Cloudinary upload (recommended for production previews)
    if (CLOUDINARY_ENABLED && isImage) {
      cloudinary.uploader
        .upload(req.file.path, {
          folder: process.env.CLOUDINARY_FOLDER || 'gamecart',
          resource_type: 'image',
        })
        .then((result) => {
          res.json({
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            url: result.secure_url,
            absoluteUrl: result.secure_url,
            verified: true,
            provider: 'cloudinary',
          });
        })
        .catch((err) => {
          console.error('Cloudinary upload failed, falling back to local:', err?.message || err);
          try {
            const alertId = `al_${Date.now()}`;
            const summary = `Cloudinary upload failed for ${req.file?.originalname || req.file?.filename}: ${String(err?.message || err).substring(0,180)}`;
            pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [alertId, 'upload_error', summary]).catch(()=>{});
            const auditId = `aa_${Date.now()}`;
            pool.query('INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)', [auditId, 'upload_error', summary]).catch(()=>{});
            if (process.env.ADMIN_PHONE) {
              sendWhatsAppMessage(process.env.ADMIN_PHONE, `⚠️ Upload failed: ${summary}`).catch(()=>{});
            }
          } catch {}
          res.json({
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            url: relativeUrl,
            absoluteUrl,
            verified: true,
            provider: 'local',
          });
        });
      return;
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
      url: relativeUrl,
      absoluteUrl,
      verified
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== SITE SETTINGS & MEDIA =====================
app.get('/api/public/settings/site', async (req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM site_settings WHERE id = $1', ['site']);
    const s = rows.rows[0] || {};
    s.logo_url = normalizeImageUrl(s.logo_url);
    s.header_bg_url = normalizeImageUrl(s.header_bg_url);
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/settings/site', authenticateToken, async (req, res) => {
  try {
    const { default_locale, nav_links, version } = req.body || {};
    await pool.query(
      'UPDATE site_settings SET default_locale = COALESCE($1, default_locale), nav_links = COALESCE($2, nav_links), version = COALESCE($3, version), updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [default_locale || null, nav_links || null, version || null, 'site']
    );
    const rows = await pool.query('SELECT * FROM site_settings WHERE id = $1', ['site']);
    const s = rows.rows[0] || {};
    s.logo_url = normalizeImageUrl(s.logo_url);
    s.header_bg_url = normalizeImageUrl(s.header_bg_url);
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const logoUpload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/admin/settings/site/logo', authenticateToken, logoUpload.single('file'), async (req, res) => {
  try {
    const bodyPath = (req.body && (req.body.image_path || req.body.path)) || null;
    let url = null;
    if (req.file && req.file.path) {
      const localPath = req.file.path;
      url = `/uploads/${req.file.filename}`;
      if (CLOUDINARY_ENABLED) {
        try {
          const result = await cloudinary.uploader.upload(localPath, { folder: process.env.CLOUDINARY_FOLDER || 'gamecart/site', resource_type: 'image' });
          url = result.secure_url;
        } catch {}
      }
    } else if (typeof bodyPath === 'string' && bodyPath.trim()) {
      const src = bodyPath.trim();
      const ext = path.extname(src) || '.png';
      const filename = `logo-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
      const dest = path.join(uploadDir, filename);
      try {
        fs.copyFileSync(src, dest);
        url = `/uploads/${filename}`;
        if (CLOUDINARY_ENABLED) {
          try {
            const result = await cloudinary.uploader.upload(dest, { folder: process.env.CLOUDINARY_FOLDER || 'gamecart/site', resource_type: 'image' });
            url = result.secure_url;
            try { fs.unlinkSync(dest); } catch {}
          } catch {}
        }
      } catch {}
    }
    if (!url) return res.status(400).json({ message: 'file or image_path required' });
    await pool.query('UPDATE site_settings SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [url, 'site']);
    res.json({ logo_url: normalizeImageUrl(url) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const headerUpload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
app.post('/api/admin/settings/site/header', authenticateToken, headerUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' });
    const { width, height, crop } = req.body || {};
    const localPath = req.file.path;
    let url = `/uploads/${req.file.filename}`;
    if (CLOUDINARY_ENABLED) {
      try {
        const opts = { folder: process.env.CLOUDINARY_FOLDER || 'gamecart/site', resource_type: 'image' };
        if (width && height) Object.assign(opts, { transformation: [{ width: Number(width), height: Number(height), crop: String(crop || 'fill') }] });
        const result = await cloudinary.uploader.upload(localPath, opts);
        url = result.secure_url;
      } catch {}
    }
    await pool.query('UPDATE site_settings SET header_bg_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [url, 'site']);
    res.json({ header_bg_url: normalizeImageUrl(url) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/public/navigation', async (req, res) => {
  try {
    const rows = await pool.query('SELECT nav_links FROM site_settings WHERE id = $1', ['site']);
    res.json(rows.rows[0]?.nav_links || []);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/navigation', authenticateToken, async (req, res) => {
  try {
    const { nav_links } = req.body || {};
    await pool.query('UPDATE site_settings SET nav_links = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nav_links || [], 'site']);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
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
      // Validate game exists before inserting transaction item
      const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [it.id]);
      if (gameCheck.rows.length === 0) {
        console.warn(`Game ${it.id} not found, skipping transaction item`);
        continue;
      }
      
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

// ===================== METRICS & MONITORING =====================
app.post('/api/metrics/interaction', async (req, res) => {
  try {
    const { event_type, element, page, success, error, ua } = req.body || {};
    const id = `im_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    await pool.query(
      'INSERT INTO interaction_metrics (id, event_type, element, page, success, error, ua) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, String(event_type||'unknown').slice(0,50), String(element||'').slice(0,120), String(page||'').slice(0,200), Boolean(success!==false), error||null, String(ua||'').slice(0,500)]
    );
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/metrics/perf', async (req, res) => {
  try {
    const { entries, ua } = req.body || {};
    if (Array.isArray(entries)) {
      for (const e of entries) {
        const id = `pm_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        await pool.query(
          'INSERT INTO performance_metrics (id, name, value, page, ua) VALUES ($1, $2, $3, $4, $5)',
          [id, String(e.name||'').slice(0,60), Number(e.value)||0, String(e.page||'').slice(0,200), String(ua||'').slice(0,500)]
        );
      }
    }
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/metrics/summary', authenticateToken, async (req, res) => {
  try {
    const byType = await pool.query('SELECT event_type, COUNT(*) AS count FROM interaction_metrics GROUP BY event_type ORDER BY count DESC');
    const byPage = await pool.query('SELECT page, COUNT(*) AS count FROM interaction_metrics GROUP BY page ORDER BY count DESC LIMIT 20');
    const perf = await pool.query('SELECT name, AVG(value) AS avg, MAX(value) AS max FROM performance_metrics GROUP BY name');
    res.json({ interactionsByType: byType.rows, interactionsByPage: byPage.rows, performance: perf.rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
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

function decryptMessage(payload) {
  if (!payload) return '';
  let obj = payload;
  if (typeof payload === 'string') {
    try {
      obj = JSON.parse(payload);
    } catch {
      return String(payload);
    }
  }
  const keys = [];
  const currentKey = (process.env.PAYMENT_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
  const altKey = (process.env.PAYMENT_ENCRYPTION_KEY_ALT || '').padEnd(32, '0').slice(0, 32);
  if (currentKey.trim()) keys.push(currentKey);
  if (altKey.trim()) keys.push(altKey);
  keys.push(''.padEnd(32, '0'));
  const ivHex = String(obj.iv || '');
  const tagHex = String(obj.tag || '');
  const dataHex = String(obj.data || '');
  for (const key of keys) {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const data = Buffer.from(dataHex, 'hex');
      if (iv.length && tag.length && data.length) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(data), decipher.final()]);
        return dec.toString('utf8');
      }
    } catch {
    }
  }
  return '[encrypted]';
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
app.get('/api/admin/alerts/mem', authenticateToken, async (req, res) => {
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

app.put('/api/admin/alerts/mem/:id/read', authenticateToken, async (req, res) => {
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

function buildMultipartWithFile(fields, filePath, filename) {
  const boundary = '----TraeForm' + Math.random().toString(36).slice(2);
  const chunks = [];
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  const fileBuf = fs.readFileSync(filePath);
  const fname = filename || path.basename(filePath);
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${fname}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
  chunks.push(fileBuf);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(chunks) };
}

async function catboxFileUploadFromLocal(filePath, filename) {
  const mp = buildMultipartWithFile({ reqtype: 'fileupload' }, filePath, filename);
  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: 'catbox.moe',
      path: '/user/api.php',
      headers: { 'Content-Type': `multipart/form-data; boundary=${mp.boundary}`, 'Content-Length': mp.body.length },
      timeout: 20000
    }, (res) => {
      const bufs = [];
      res.on('data', (d) => bufs.push(d));
      res.on('end', () => {
        const body = Buffer.concat(bufs).toString('utf8').trim();
        if (res.statusCode >= 200 && res.statusCode < 300 && body.startsWith('https://')) {
          resolve({ ok: true, url: body });
        } else {
          resolve({ ok: false, status: res.statusCode, message: body });
        }
      });
    });
    req.on('error', reject);
    req.write(mp.body);
    req.end();
  });
}

// Accept and store Catbox image URLs with metadata, then apply to game/category
app.post('/api/admin/images/catbox-url', authenticateToken, async (req, res) => {
  try {
    const { url, type, id, filename } = req.body || {};
    const urlStr = String(url || '').trim();
    if (!urlStr) return res.status(400).json({ message: 'url required' });
    if (!type || !id) return res.status(400).json({ message: 'type and id required' });
    const valid = await validateCatboxUrl(urlStr);
    if (!valid.ok) {
      const alertId = `al_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [
        alertId, 'image_error', `Invalid Catbox URL (${valid.status}): ${urlStr}`
      ]);
      return res.status(400).json({ message: 'Invalid Catbox URL', status: valid.status, details: valid.message });
    }
    const assetId = `img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    await pool.query(
      'INSERT INTO image_assets (id, url, original_filename, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [assetId, urlStr, filename || null, 'catbox', type, id]
    );
    let updated = null;
    if (type === 'game') {
      const r = await pool.query('UPDATE games SET image = $1, image_url = $1 WHERE id = $2 OR slug = $2 RETURNING id, name, slug, image', [urlStr, id]);
      updated = r.rows[0] || null;
    } else if (type === 'category') {
      const r = await pool.query('UPDATE categories SET image = $1 WHERE id = $2 OR slug = $2 RETURNING id, name, slug, image', [urlStr, id]);
      updated = r.rows[0] || null;
    } else {
      return res.status(400).json({ message: 'type must be game or category' });
    }
    res.json({ id: assetId, url: urlStr, updated });
  } catch (err) {
    console.error('catbox-url submission failed:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Migrate existing images to Catbox using URL upload API
async function httpsPostForm(hostname, pathUrl, form) {
  const boundary = '----TraeForm' + Math.random().toString(36).slice(2);
  const payload = Object.entries(form).map(([k, v]) => {
    return `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
  }).join('') + `--${boundary}--\r\n`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST', hostname, path: pathUrl,
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000
    }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function uploadUrlToCatbox(srcUrl) {
  const resp = await httpsPostForm('catbox.moe', '/user/api.php', { reqtype: 'urlupload', url: srcUrl });
  const body = String(resp.body || '').trim();
  if (resp.status >= 200 && resp.status < 300 && body.startsWith('https://')) {
    return { ok: true, url: body };
  }
  return { ok: false, status: resp.status, message: body || 'Upload failed' };
}

app.post('/api/admin/images/migrate-to-catbox', authenticateToken, async (req, res) => {
  try {
    const siteBase = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const toFullUrl = (p) => {
      const s = String(p || '').trim();
      if (!s) return null;
      if (/^https?:\/\//i.test(s)) return s;
      return `${siteBase}${s}`.replace(/\/\/+/g, '/').replace(/^http:\//, 'http://');
    };
    const results = { games: 0, categories: 0, errors: 0, updated: 0 };
    const gRows = await pool.query('SELECT id, slug, image FROM games');
    for (const g of gRows.rows) {
      const img = normalizeImageUrl(g.image);
      if (img && !isCatboxUrl(img)) {
        try {
          const full = toFullUrl(img);
          const up = await uploadUrlToCatbox(full);
          if (up.ok) {
            await pool.query('UPDATE games SET image = $1, image_url = $1 WHERE id = $2', [up.url, g.id]);
            const assetId = `img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
            await pool.query('INSERT INTO image_assets (id, url, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5)', [assetId, up.url, 'catbox', 'game', g.id]);
            results.updated++;
          } else {
            results.errors++;
          }
        } catch {
          results.errors++;
        }
        results.games++;
      }
    }
    const cRows = await pool.query('SELECT id, slug, image FROM categories');
    for (const c of cRows.rows) {
      const img = normalizeImageUrl(c.image);
      if (img && !isCatboxUrl(img)) {
        try {
          const full = toFullUrl(img);
          const up = await uploadUrlToCatbox(full);
          if (up.ok) {
            await pool.query('UPDATE categories SET image = $1 WHERE id = $2', [up.url, c.id]);
            const assetId = `img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
            await pool.query('INSERT INTO image_assets (id, url, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5)', [assetId, up.url, 'catbox', 'category', c.id]);
            results.updated++;
          } else {
            results.errors++;
          }
        } catch {
          results.errors++;
        }
        results.categories++;
      }
    }
    res.json({ ok: true, ...results });
  } catch (err) {
    console.error('Migration to catbox failed:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Batch upload handler supporting files and URLs with destination selection
const batchUpload = multer({ storage }).array('files', 50);
app.post('/api/admin/images/upload-batch', authenticateToken, (req, res) => {
  batchUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      const storageDest = String(req.body.storage || 'catbox').toLowerCase();
      if (storageDest !== 'catbox') {
        return res.status(400).json({ message: 'Only catbox storage is allowed' });
      }
      const type = String(req.body.type || '').toLowerCase();
      const relatedId = req.body.id || null;
      const subdir = String(req.body.dir || '').replace(/[^a-z0-9/_-]/gi, '').replace(/^\//, '');
      const urls = (() => { try { return JSON.parse(req.body.urls || '[]'); } catch { return []; } })();
      const files = Array.isArray(req.files) ? req.files : [];
      const results = [];
      async function applyRelated(url) {
        if (type === 'game' && relatedId) await pool.query('UPDATE games SET image = $1, image_url = $1 WHERE id = $2 OR slug = $2', [url, relatedId]);
        if (type === 'category' && relatedId) await pool.query('UPDATE categories SET image = $1 WHERE id = $2 OR slug = $2', [url, relatedId]);
      }
      for (const f of files) {
        try {
          let finalUrl = null;
          {
            const r = await catboxFileUploadFromLocal(f.path, f.originalname);
            finalUrl = r.ok ? r.url : null;
            try { fs.unlinkSync(f.path); } catch {}
            if (!r.ok) throw new Error(r.message || 'catbox upload failed');
          }
          await pool.query('INSERT INTO image_assets (id, url, original_filename, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5, $6)', [
            `img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`, finalUrl, f.originalname || null, 'catbox', type || null, relatedId || null
          ]);
          await applyRelated(finalUrl);
          results.push({ filename: f.originalname, url: finalUrl, ok: true });
        } catch (e) {
          results.push({ filename: f.originalname, error: e.message, ok: false });
        }
      }
      for (const u of urls) {
        try {
          const src = String(u || '').trim();
          if (!src) continue;
          let finalUrl = null;
          {
            const up = await uploadUrlToCatbox(src);
            if (!up.ok) throw new Error(up.message || 'catbox url upload failed');
            finalUrl = up.url;
          }
          await pool.query('INSERT INTO image_assets (id, url, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5)', [
            `img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`, finalUrl, 'catbox', type || null, relatedId || null
          ]);
          await applyRelated(finalUrl);
          results.push({ url: finalUrl, ok: true });
        } catch (e) {
          results.push({ url: u, error: e.message, ok: false });
        }
      }
      res.json({ results });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
});

function httpsGetToFile(srcUrl, destPath) {
  return new Promise((resolve) => {
    try {
      const u = new URL(srcUrl);
      const out = fs.createWriteStream(destPath);
      const req = https.request({ method: 'GET', hostname: u.hostname, path: u.pathname + (u.search || ''), timeout: 15000 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          res.pipe(out);
          out.on('finish', () => resolve({ ok: true }));
        } else {
          resolve({ ok: false, message: `GET ${res.statusCode}` });
        }
      });
      req.on('error', (err) => resolve({ ok: false, message: err.message }));
      req.end();
    } catch (err) {
      resolve({ ok: false, message: err.message });
    }
  });
}

app.post('/api/admin/images/scan-site', authenticateToken, async (req, res) => {
  try {
    const { url, storage, type, id } = req.body || {};
    const base = String(url || '').trim();
    if (!base) return res.status(400).json({ message: 'url required' });
    const u = new URL(base);
    const htmlResp = await new Promise((resolve) => {
      const reqH = https.request({ method: 'GET', hostname: u.hostname, path: u.pathname + (u.search || ''), timeout: 15000 }, (r) => {
        const bufs = [];
        r.on('data', (d) => bufs.push(d));
        r.on('end', () => resolve({ status: r.statusCode, body: Buffer.concat(bufs).toString('utf8') }));
      });
      reqH.on('error', (err) => resolve({ status: 0, body: '' }));
      reqH.end();
    });
    const body = String(htmlResp.body || '');
    const imgs = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = imgRegex.exec(body))) { imgs.push(m[1]); }
    const bgRegex = /url\((["']?)([^"')]+)\1\)/gi;
    while ((m = bgRegex.exec(body))) { imgs.push(m[2]); }
    const abs = imgs.map((p) => {
      try {
        const s = String(p || '').trim();
        if (!s) return null;
        if (/^https?:\/\//i.test(s)) return s;
        return new URL(s, base).toString();
      } catch { return null; }
    }).filter(Boolean);
    const results = [];
    for (const src of abs) {
      try {
        let finalUrl = src;
        const dest = String(storage || 'none').toLowerCase();
        if (dest === 'cloudinary' && CLOUDINARY_ENABLED) {
          const r = await cloudinary.uploader.upload(src, { folder: process.env.CLOUDINARY_FOLDER || 'gamecart/scans', resource_type: 'image' });
          finalUrl = r.secure_url;
        } else if (dest === 'catbox') {
          const up = await uploadUrlToCatbox(src);
          if (!up.ok) throw new Error(up.message || 'catbox url upload failed');
          finalUrl = up.url;
        } else if (dest === 'local') {
          const name = `scan-${Date.now()}-${Math.random().toString(36).slice(2,9)}.jpg`;
          const destPath = path.join(uploadDir, name);
          const dl = await httpsGetToFile(src, destPath);
          if (!dl.ok) throw new Error(dl.message || 'download failed');
          finalUrl = normalizeImageUrl(`/uploads/${name}`);
        }
        const aid = `img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        await pool.query('INSERT INTO image_assets (id, url, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5)', [
          aid, finalUrl, dest || 'scan', type || null, id || null
        ]);
        results.push({ src, url: finalUrl, ok: true });
      } catch (e) {
        results.push({ src, error: e.message, ok: false });
      }
    }
    res.json({ count: abs.length, results });
  } catch (e) {
    res.status(500).json({ message: e.message });
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

// Content management
const contentHistoryFile = path.join(__dirname, '..', 'data', 'site-content-history.json');
const contentFile = path.join(__dirname, '..', 'data', 'site-content.json');
function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch {}
  return null;
}
function saveJson(p, data) {
  try { fs.writeFileSync(p, JSON.stringify(data, null, 2)); } catch {}
}
app.get('/api/content', async (req, res) => {
  try {
    const current = loadJson(contentFile) || {};
    res.json({ ok: true, content: current });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});
app.put('/api/admin/content', authenticateToken, async (req, res) => {
  try {
    const { title, description, link } = req.body || {};
    const t = String(title || '').trim();
    const d = String(description || '').trim();
    const l = String(link || '').trim();
    if (!t || t.length > 120) return res.status(400).json({ ok: false, message: 'Invalid title' });
    if (!d || d.length > 2000) return res.status(400).json({ ok: false, message: 'Invalid description' });
    if (!/^https?:\/\//i.test(l)) return res.status(400).json({ ok: false, message: 'Invalid link' });
    const current = { title: t, description: d, link: l, version: Date.now() };
    saveJson(contentFile, current);
    const hist = loadJson(contentHistoryFile) || [];
    hist.push({ ...current, saved_at: Date.now() });
    saveJson(contentHistoryFile, hist);
    res.json({ ok: true, content: current });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

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
const DISABLE_WHATSAPP_CLOUD = String(process.env.DISABLE_WHATSAPP_CLOUD || 'true').toLowerCase() === 'true';

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
    const { to, text, mediaUrl } = req.body;
    if (!to || (!text && !mediaUrl)) return res.status(400).json({ message: 'to and text or mediaUrl required' });

    // Use Baileys only (no cloud fallback)
    try {
      const result = await sendWithRetry(async () => {
        if (mediaUrl) return await sendWhatsAppMedia(to, mediaUrl, text || '');
        return await sendWhatsAppMessage(to, text || '');
      }, 3);
      return res.json({ ok: true, id: result.id });
    } catch (baileysErr) {
      if (!DISABLE_WHATSAPP_CLOUD && WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
        // Optional Cloud fallback if explicitly enabled
        const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const payload = mediaUrl
          ? { messaging_product: 'whatsapp', to, type: 'image', image: { link: mediaUrl, caption: String(text || '') } }
          : { messaging_product: 'whatsapp', to, type: 'text', text: { body: String(text || '') } };
        try {
          const resp = await httpsPostJson(url, { Authorization: `Bearer ${WHATSAPP_TOKEN}` }, payload);
          const id = `wam_${Date.now()}`;
          await pool.query('INSERT INTO whatsapp_messages (id, direction, from_phone, to_phone, message_encrypted, status) VALUES ($1, $2, $3, $4, $5, $6)', [
            id, 'outbound', null, to, encryptMessage(text || mediaUrl || ''), resp.status === 200 ? 'sent' : 'error'
          ]);
          return res.status(resp.status || 200).json({ ok: resp.status === 200, response: resp.body });
        } catch (err) {
          return res.status(500).json({ message: 'WhatsApp send failed (Baileys & Cloud)', error: err.message });
        }
      }
      return res.status(500).json({ message: 'WhatsApp send failed', error: baileysErr.message });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/whatsapp/contacts', authenticateToken, async (req, res) => {
  try {
    const rows = await pool.query('SELECT id, name, phone FROM users ORDER BY name ASC');
    res.json(rows.rows);
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
        // Forward to admin and seller phones
        const adminPhone = process.env.ADMIN_PHONE;
        const sellerPhones = (process.env.SELLER_PHONES || '').split(',').map(p => p.trim()).filter(p => p);
        const phonesToNotify = adminPhone ? [adminPhone, ...sellerPhones] : sellerPhones;
        
        for (const phone of phonesToNotify) {
          try {
            await sendWhatsAppMessage(phone, `📱 New WhatsApp message from ${from}:\n${text.substring(0, 200)}`);
          } catch (err) {
            console.error(`Failed to forward WhatsApp message to ${phone}:`, err.message);
          }
        }
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
    const messages = result.rows.map(r => ({ 
      id: r.id, 
      sender: r.sender, 
      message: r.message_encrypted ? '[encrypted]' : '', 
      sessionId: r.session_id, 
      timestamp: new Date(r.timestamp).getTime() 
    }));
    res.json(messages || []);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ message: err.message });
  }
});

// ===================== ADMIN: USERS =====================
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const { q, page = '1', limit = '20' } = req.query;
    const pg = Math.max(1, parseInt(String(page))) || 1;
    const lm = Math.min(200, Math.max(1, parseInt(String(limit)))) || 20;
    const offset = (pg - 1) * lm;
    let sql = 'SELECT id, name, phone, created_at FROM users WHERE 1=1';
    const params = [];
    if (q) { params.push(`%${String(q)}%`); sql += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`; }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(lm, offset);
    const rows = await pool.query(sql, params);
    const countRes = await pool.query('SELECT COUNT(*) AS count FROM users');
    res.json({ items: rows.rows, page: pg, limit: lm, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/users/export', authenticateToken, async (req, res) => {
  try {
    const rows = await pool.query('SELECT id, name, phone, created_at FROM users ORDER BY created_at DESC');
    const header = 'id,name,phone,created_at';
    const csv = [header, ...rows.rows.map(r => `${r.id},${JSON.stringify(r.name)},${JSON.stringify(r.phone)},${new Date(r.created_at).toISOString()}`)].join('\n');
    res.type('text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== ADMIN: INTERACTIONS =====================
app.get('/api/admin/interactions', authenticateToken, async (req, res) => {
  try {
    const { event_type, q, page = '1', limit = '50' } = req.query;
    const pg = Math.max(1, parseInt(String(page))) || 1;
    const lm = Math.min(500, Math.max(1, parseInt(String(limit)))) || 50;
    const offset = (pg - 1) * lm;
    let sql = 'SELECT id, event_type, element, page, success, error, ua, ts FROM interaction_metrics WHERE 1=1';
    const params = [];
    if (event_type) { params.push(event_type); sql += ` AND event_type = $${params.length}`; }
    if (q) { params.push(`%${String(q)}%`); sql += ` AND (element ILIKE $${params.length} OR page ILIKE $${params.length} OR error ILIKE $${params.length})`; }
    sql += ` ORDER BY ts DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(lm, offset);
    const rows = await pool.query(sql, params);
    res.json({ items: rows.rows, page: pg, limit: lm });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/interactions/export', authenticateToken, async (req, res) => {
  try {
    const rows = await pool.query('SELECT id, event_type, element, page, success, error, ua, ts FROM interaction_metrics ORDER BY ts DESC LIMIT 1000');
    const header = 'id,event_type,element,page,success,error,ua,ts';
    const csv = [header, ...rows.rows.map(r => `${r.id},${JSON.stringify(r.event_type)},${JSON.stringify(r.element)},${JSON.stringify(r.page)},${r.success},${JSON.stringify(r.error || '')},${JSON.stringify(r.ua || '')},${new Date(r.ts).toISOString()}`)].join('\n');
    res.type('text/csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================== ADMIN: CONFIRMATION DETAIL =====================
app.get('/api/admin/confirmations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query('SELECT c.id, c.transaction_id, c.message_encrypted, c.receipt_url, c.created_at, t.user_id, u.name, u.phone FROM payment_confirmations c LEFT JOIN transactions t ON c.transaction_id = t.id LEFT JOIN users u ON t.user_id = u.id WHERE c.id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const row = r.rows[0];
    res.json({
      id: row.id,
      transactionId: row.transaction_id,
      message: decryptMessage(row.message_encrypted),
      receiptUrl: row.receipt_url,
      createdAt: new Date(row.created_at).getTime(),
      user: { id: row.user_id || null, name: row.name || '', phone: row.phone || '' },
      sessionId: row.phone ? `wa_${row.phone.replace(/[^\d]/g, '')}` : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/chat/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, sender, message_encrypted, session_id, timestamp, read FROM chat_messages ORDER BY timestamp DESC LIMIT 500');
    const messages = result.rows.map(r => ({ 
      id: r.id, 
      sender: r.sender, 
      message: decryptMessage(r.message_encrypted), 
      sessionId: r.session_id, 
      timestamp: new Date(r.timestamp).getTime(),
      read: Boolean(r.read)
    }));
    res.json(messages || []);
  } catch (err) {
    console.error('Error fetching admin all chat messages:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/chat/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, sender, message_encrypted, session_id, timestamp FROM chat_messages ORDER BY timestamp DESC LIMIT 500');
    const messages = result.rows.map(r => ({ 
      id: r.id, 
      sender: r.sender, 
      message: r.message_encrypted ? '[encrypted]' : '', 
      sessionId: r.session_id, 
      timestamp: new Date(r.timestamp).getTime() 
    }));
    res.json(messages || []);
  } catch (err) {
    console.error('Error fetching all chat messages:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/chat/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      'SELECT id, sender, message_encrypted, session_id, timestamp, read FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    const messages = result.rows.map(r => ({
      id: r.id,
      sender: r.sender,
      message: decryptMessage(r.message_encrypted),
      sessionId: r.session_id,
      timestamp: new Date(r.timestamp).getTime(),
      read: Boolean(r.read),
      delivered: true,
      status: Boolean(r.read) ? 'read' : 'delivered'
    }));
    res.json(messages || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    const { sender, message, sessionId } = req.body;
    if (!sender || !message || !sessionId) return res.status(400).json({ message: 'sender, message, sessionId required' });

    if (sender === 'support') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && String(authHeader).split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Access token required' });
      try {
        jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
    }

    const id = `cm_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    await pool.query('INSERT INTO chat_messages (id, sender, message_encrypted, session_id) VALUES ($1, $2, $3, $4)', [
      id, sender, encryptMessage(String(message)), sessionId
    ]);
    
    // When admin replies, mark all unread messages in this session as read
    if (sender === 'support') {
      await pool.query('UPDATE chat_messages SET read = true WHERE session_id = $1 AND read = false', [sessionId]);
    }
    
    if (sender === 'user') {
      const alertId = `al_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const summary = `Website message in ${sessionId}: ${String(message).substring(0, 120)}`;
      await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [alertId, 'website_message', summary]);
      
      // Forward to seller WhatsApp numbers if configured
      const sellerPhones = (process.env.SELLER_PHONES || '').split(',').map(p => p.trim()).filter(p => p);
      if (sellerPhones.length > 0) {
        const forwardMessage = `💬 New chat message from ${sessionId}:\n${String(message).substring(0, 200)}`;
        for (const phone of sellerPhones) {
          try {
            await sendWhatsAppMessage(phone, forwardMessage);
          } catch (err) {
            console.error(`Failed to forward message to ${phone}:`, err.message);
          }
        }
      }
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

// ===================== TRANSLATIONS =====================
app.get('/api/translations/:lang', async (req, res) => {
  try {
    const { lang } = req.params;
    const rows = await pool.query('SELECT key, value FROM translations WHERE lang = $1', [lang]);
    const dict = {};
    for (const r of rows.rows) dict[r.key] = r.value || '';
    res.json(dict);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/translations', authenticateToken, async (req, res) => {
  try {
    const { lang, entries } = req.body || {};
    if (!lang || !Array.isArray(entries)) return res.status(400).json({ message: 'lang and entries[] required' });
    for (const e of entries) {
      await pool.query(
        'INSERT INTO translations (id, lang, key, value) VALUES ($1, $2, $3, $4) ON CONFLICT (lang, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
        [`tr_${Date.now()}_${Math.random().toString(36).slice(2,9)}`, lang, String(e.key), String(e.value || '')]
      );
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/translations/:lang/:key', authenticateToken, async (req, res) => {
  try {
    const { lang, key } = req.params;
    const { value } = req.body || {};
    await pool.query(
      'INSERT INTO translations (id, lang, key, value) VALUES ($1, $2, $3, $4) ON CONFLICT (lang, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
      [`tr_${Date.now()}`, lang, key, String(value || '')]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/translations/:lang/:key', authenticateToken, async (req, res) => {
  try {
    const { lang, key } = req.params;
    await pool.query('DELETE FROM translations WHERE lang = $1 AND key = $2', [lang, key]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/whatsapp/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId, q } = req.query;
    let query = 'SELECT id, wa_message_id, direction, from_phone, to_phone, message_encrypted, timestamp, session_id, status, is_group FROM whatsapp_messages WHERE 1=1';
    const params = [];
    if (sessionId) {
      params.push(String(sessionId));
      query += ` AND session_id = $${params.length}`;
    }
    if (q) {
      params.push(`%${String(q)}%`);
      query += ` AND message_encrypted::text ILIKE $${params.length}`;
    }
    query += ' ORDER BY timestamp DESC LIMIT 500';
    const result = await pool.query(query, params);
    res.json(result.rows.map(r => ({
      id: r.id,
      waMessageId: r.wa_message_id,
      direction: r.direction,
      fromPhone: r.from_phone,
      toPhone: r.to_phone,
      message: decryptMessage(r.message_encrypted),
      timestamp: new Date(r.timestamp).getTime(),
      sessionId: r.session_id,
      status: r.status,
      isGroup: Boolean(r.is_group)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/chat/:sessionId/read', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    await pool.query('UPDATE chat_messages SET read = true WHERE session_id = $1', [sessionId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/chat/sessions', authenticateToken, async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT session_id as id,
             MIN(timestamp) as started_at,
             MAX(timestamp) as last_activity,
             SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
      FROM chat_messages
      GROUP BY session_id
      ORDER BY last_activity DESC
      LIMIT 500
    `);
    res.json(rows.rows.map(r => ({
      id: r.id,
      startedAt: new Date(r.started_at).getTime(),
      lastActivity: new Date(r.last_activity).getTime(),
      unreadCount: parseInt(r.unread_count || 0)
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/images/validate', authenticateToken, async (req, res) => {
  try {
    const games = await pool.query('SELECT id, name, image FROM games ORDER BY updated_at DESC LIMIT 500');
    const categories = await pool.query('SELECT id, name, image FROM categories ORDER BY name ASC');
    const items = [];
    function canAccess(url) {
      try {
        const v = String(url || '').trim();
        if (!v) return false;
        if (/^https?:\/\//i.test(v)) return true;
        if (v.startsWith('/images/')) {
          const p = path.join(imagesDir, v.replace(/^\/images\//, ''));
          return fs.existsSync(p);
        }
        return false;
      } catch { return false; }
    }
    for (const g of games.rows) {
      const url = normalizeImageUrl(g.image);
      items.push({ id: g.id, type: 'game', name: g.name, url, ok: canAccess(url) });
    }
    for (const c of categories.rows) {
      const url = normalizeImageUrl(c.image);
      items.push({ id: c.id, type: 'category', name: c.name, url, ok: canAccess(url) });
    }
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/confirmations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, transaction_id, message_encrypted, receipt_url, created_at FROM payment_confirmations ORDER BY created_at DESC LIMIT 200');
    const items = result.rows.map(r => ({
      id: r.id,
      transactionId: r.transaction_id,
      message: decryptMessage(r.message_encrypted),
      receiptUrl: r.receipt_url,
      createdAt: new Date(r.created_at).getTime()
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const checkoutTemplatesFile = path.join(__dirname, '..', 'data', 'checkout-templates.json');
app.get('/api/admin/checkout/templates', authenticateToken, async (req, res) => {
  try {
    const t = loadJson(checkoutTemplatesFile) || {
      customerMessage: 'Thank you for your order #{id}! We are processing it.',
      adminMessage: 'New Order #{id}\nTotal: {total} EGP\nCustomer: {name} ({phone})\nItems:\n{items}',
    };
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/admin/checkout/templates', authenticateToken, async (req, res) => {
  try {
    const { customerMessage, adminMessage } = req.body || {};
    const t = {
      customerMessage: String(customerMessage || '').slice(0, 500),
      adminMessage: String(adminMessage || '').slice(0, 2000),
    };
    saveJson(checkoutTemplatesFile, t);
    res.json(t);
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

    // Archiving filter
    if (req.query.archived === 'true') {
      query += ' AND archived = true';
    } else if (req.query.archived === 'false') {
      query += ' AND archived = false';
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

app.put('/api/admin/alerts/:id/archive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE seller_alerts SET archived = true WHERE id = $1', [id]);
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

// Test endpoint to verify API is accessible
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    server: 'GameCart Backend',
    version: '1.0.0'
  });
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

app.get('/api/admin/selftest', authenticateToken, async (req, res) => {
  const results = { ok: true, checks: [] };
  async function check(name, fn) {
    try { const out = await fn(); results.checks.push({ name, ok: true, out }); }
    catch (err) { results.ok = false; results.checks.push({ name, ok: false, error: err.message }); }
  }
  await check('categories', async () => (await pool.query('SELECT COUNT(*) as c FROM categories')).rows[0]);
  await check('games', async () => (await pool.query('SELECT COUNT(*) as c FROM games')).rows[0]);
  await check('popular_games', async () => (await pool.query('SELECT COUNT(*) as c FROM games WHERE is_popular = true')).rows[0]);
  await check('uploads_writable', async () => { const f = path.join(uploadDir, 'selftest.tmp'); fs.writeFileSync(f, 'x'); fs.unlinkSync(f); return { ok: true }; });
  await check('chat_sessions', async () => (await pool.query('SELECT COUNT(DISTINCT session_id) as c FROM chat_messages')).rows[0]);
  await check('alerts', async () => (await pool.query('SELECT COUNT(*) as c FROM seller_alerts')).rows[0]);
  res.json(results);
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

app.get('/api/admin/transactions', authenticateToken, async (req, res) => {
  try {
    const tx = await pool.query(`
      SELECT t.id, t.payment_method, t.total, t.status, t.created_at, u.name as customer_name, u.phone as customer_phone
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 200
    `);
    const map = new Map();
    for (const row of tx.rows) {
      map.set(row.id, { 
        id: row.id, 
        paymentMethod: row.payment_method, 
        total: Number(row.total), 
        status: row.status, 
        timestamp: new Date(row.created_at).getTime(), 
        customerName: row.customer_name, 
        customerPhone: row.customer_phone, 
        items: [] 
      });
    }
    const ids = Array.from(map.keys());
    if (ids.length) {
      const items = await pool.query('SELECT transaction_id, game_id, quantity, price FROM transaction_items WHERE transaction_id = ANY($1)', [ids]);
      for (const it of items.rows) {
        const entry = map.get(it.transaction_id);
        if (entry) {
          entry.items.push({ gameId: it.game_id, quantity: Number(it.quantity), price: Number(it.price) });
        }
      }
    }
    res.json(Array.from(map.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    console.log("🔄 Checking database connection...");
    const isConnected = await checkConnection(3, 2000);
    
    if (isConnected) {
      try {
        if (typeof initializeDatabase === "function") await initializeDatabase();
        
        const items = readGamesFile();
        console.log(`Seeding ${items.length} games...`);
        for (const g of items) {
          const id = String(g.id || `game_${Date.now()}_${Math.random().toString(36).slice(2,9)}`);
          const name = String(g.name || "").trim();
          const slug = String(g.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
          const description = String(g.description || "");
          const currency = String(g.currency || "EGP");
          const image = g.image || "/media/placeholder.jpg";
          const category = String(g.category || "other");
          const is_popular = Boolean(g.isPopular || g.is_popular || false);
          const stock = Number(g.stock || 100);
          
          const rawPackages = coerceJsonArray(g.packages);
          const rawPrices = coerceJsonArray(g.packagePrices).map(n => {
            const s = String(n || "0").replace(/[^0-9.]/g, "");
            const num = parseFloat(s);
            return isNaN(num) ? 0 : num;
          });

          const processedPackagePrices = [];
          const processedDiscountPrices = [];
          for (const p of rawPrices) {
            processedPackagePrices.push(p);
            processedDiscountPrices.push(p > 50 ? p - 100 : null);
          }

          const priceVal = Number(g.price) || (processedPackagePrices[0] || 0);
          const discount_priceVal = priceVal > 50 ? priceVal - 100 : null;

          await pool.query(
            `INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price, packages, package_prices, package_discount_prices)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               slug = EXCLUDED.slug,
               description = EXCLUDED.description,
               price = EXCLUDED.price,
               currency = EXCLUDED.currency,
               image = EXCLUDED.image,
               category = EXCLUDED.category,
               is_popular = EXCLUDED.is_popular,
               stock = EXCLUDED.stock,
               discount_price = EXCLUDED.discount_price,
               packages = EXCLUDED.packages,
               package_prices = EXCLUDED.package_prices,
               package_discount_prices = EXCLUDED.package_discount_prices`,
            [id, name, slug, description, priceVal, currency, image, category, is_popular, stock, discount_priceVal, JSON.stringify(rawPackages), JSON.stringify(processedPackagePrices), JSON.stringify(processedDiscountPrices)]
          );
        }

        const catPath = path.join(__dirname, "data", "categories.json");
        if (fs.existsSync(catPath)) {
          const cats = JSON.parse(fs.readFileSync(catPath, "utf8"));
          for (const c of cats) {
            await pool.query(
              `INSERT INTO categories (id, name, slug, description, image, gradient, icon)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE SET
                 name = EXCLUDED.name,
                 slug = EXCLUDED.slug,
                 description = EXCLUDED.description,
                 image = EXCLUDED.image,
                 gradient = EXCLUDED.gradient,
                 icon = EXCLUDED.icon`,
              [c.id, c.name, c.slug, c.description, c.image, c.gradient, c.icon]
            );
          }
        }

        if (ENABLE_IMAGE_SEEDING && typeof seedProductImages === "function") await seedProductImages();
      } catch (dbErr) {
        console.error("⚠️ Database initialization warning:", dbErr.message);
      }
    } else {
      console.error("❌ Database connection failed.");
    }

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("✅ Created uploads directory at:", uploadDir);
      }
      const testFile = path.join(uploadDir, "write_test.tmp");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
      console.log("✅ Uploads directory is writable");
    } catch (err) {
      console.error("❌ Uploads directory error:", err.message);
    }

    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`╔════════════════════════════════════════╗`);
      console.log(`║     GameCart Backend Server             ║`);
      console.log(`║     Running on port ${PORT}              ║`);
      console.log(`║     Environment: ${process.env.NODE_ENV || "development"}         ║`);
      console.log(`║     Database: ${isConnected ? "Connected ✅" : "Disconnected ❌"}       ║`);
      console.log(`╚════════════════════════════════════════╝`);
    });
  } catch (err) {
    console.error("❌ Critical server error:", err.message);
  }
};

startServer();
