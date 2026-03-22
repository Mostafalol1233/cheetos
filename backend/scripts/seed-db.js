import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, '..');
const repoRoot = path.join(backendDir, '..');
const publicDir = path.join(backendDir, 'public');

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function isBlank(v) {
  return v == null || String(v).trim() === '';
}

function safeJsonArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function calculatePriceFromPackage(pkg, rate) {
  const amount = parseInt(String(pkg).replace(/,/g, '').replace(/\D/g, ''), 10) || 0;
  let price = Math.ceil(amount * rate);
  if (price > 100) price = Math.ceil(price / 10) * 10;
  return String(price);
}

const DEFAULT_PACKAGES = {
  crossfire: { currency: 'ZP', packages: ['1,000 ZP', '5,000 ZP', '10,000 ZP', '20,000 ZP', '50,000 ZP', '100,000 ZP'], rate: 0.045 },
  pubgmobile: { currency: 'UC', packages: ['100 UC', '300 UC', '600 UC', '1,200 UC', '3,000 UC', '6,000 UC', '10,000 UC', '30,000 UC'], rate: 0.5 },
  roblox: { currency: 'Robux', packages: ['80 Robux', '400 Robux', '800 Robux', '1,700 Robux', '4,500 Robux', '10,000 Robux', '22,500 Robux'], rate: 0.35 },
  fortnite: { currency: 'V-Bucks', packages: ['1,000 V-Bucks', '2,800 V-Bucks', '5,000 V-Bucks', '13,500 V-Bucks'], rate: 0.45 },
  leagueoflegends: { currency: 'RP', packages: ['650 RP', '1,300 RP', '3,250 RP', '5,200 RP', '13,500 RP'], rate: 0.5 },
  callofdutymobile: { currency: 'CP', packages: ['80 CP', '200 CP', '520 CP', '1,200 CP', '2,400 CP', '5,000 CP'], rate: 0.5 },
  freefire: { currency: 'Diamonds', packages: ['10 Diamonds', '100 Diamonds', '500 Diamonds', '1,000 Diamonds', '3,000 Diamonds', '5,000 Diamonds', '10,000 Diamonds'], rate: 0.34 },
  clashofclans: { currency: 'Gems', packages: ['20 Gems', '100 Gems', '500 Gems', '1,000 Gems', '2,000 Gems', '5,000 Gems', '10,000 Gems'], rate: 0.5 },
  minecraft: { currency: 'Minecoins', packages: ['320 Minecoins', '1,000 Minecoins', '2,500 Minecoins', '5,000 Minecoins'], rate: 0.175 },
  apexlegends: { currency: 'Apex Coins', packages: ['100 Apex Coins', '200 Apex Coins', '500 Apex Coins', '1,000 Apex Coins', '2,000 Apex Coins', '4,000 Apex Coins'], rate: 0.5 },
};

function buildPublicImageIndex() {
  const index = new Map();
  if (!fs.existsSync(publicDir)) return index;
  const files = fs.readdirSync(publicDir).filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));
  for (const f of files) {
    index.set(normalizeKey(path.basename(f, path.extname(f))), f);
    index.set(normalizeKey(f), f);
  }
  return index;
}

function copyRootImagesIntoPublic() {
  if (!fs.existsSync(repoRoot)) return 0;
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const candidates = fs
    .readdirSync(repoRoot)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));

  let copied = 0;
  for (const file of candidates) {
    const src = path.join(repoRoot, file);
    const dst = path.join(publicDir, file);
    if (!fs.existsSync(dst)) {
      try {
        fs.copyFileSync(src, dst);
        copied++;
      } catch {
        // ignore
      }
    }
  }
  return copied;
}

function pickImageForEntity({ slug, name }, imageIndex) {
  const keys = [normalizeKey(slug), normalizeKey(name)];

  for (const k of keys) {
    if (!k) continue;

    // exact
    const exact = imageIndex.get(k);
    if (exact) return `/media/${exact}`;

    // common repo pattern: VALORANT / PUBG_MOBILE
    const upperUnderscore = String(slug || name || '')
      .toUpperCase()
      .replace(/-/g, '_')
      .replace(/\s+/g, '_');
    const alt = imageIndex.get(normalizeKey(upperUnderscore));
    if (alt) return `/media/${alt}`;

    // partial contains
    for (const [key, filename] of imageIndex.entries()) {
      if (key.includes(k) || k.includes(key)) {
        return `/media/${filename}`;
      }
    }
  }

  // fallback: first stock image
  const stock = imageIndex.get(normalizeKey('mobile_games_and_gif_38864dc8'));
  if (stock) return `/media/${stock}`;

  // last resort: null
  return null;
}

async function seedGames(imageIndex) {
  const res = await pool.query('SELECT id, name, slug, image, packages, package_prices as "packagePrices" FROM games');

  let updatedImages = 0;
  let updatedPackages = 0;

  for (const row of res.rows) {
    const currentImage = row.image;
    const slug = row.slug;
    const name = row.name;

    if (isBlank(currentImage) || String(currentImage).includes('placeholder')) {
      const nextImage = pickImageForEntity({ slug, name }, imageIndex);
      if (nextImage) {
        await pool.query('UPDATE games SET image = $1 WHERE id = $2', [nextImage, row.id]);
        updatedImages++;
      }
    }

    const currentPackages = safeJsonArray(row.packages);
    const currentPackagePrices = safeJsonArray(row.packagePrices);

    const k = normalizeKey(slug) || normalizeKey(name);
    const def = DEFAULT_PACKAGES[k];

    if (currentPackages.length === 0 && def) {
      const prices = def.packages.map((p) => calculatePriceFromPackage(p, def.rate));
      await pool.query('UPDATE games SET packages = $1, package_prices = $2 WHERE id = $3', [JSON.stringify(def.packages), JSON.stringify(prices), row.id]);
      updatedPackages++;
    } else if (currentPackages.length > 0 && currentPackagePrices.length === 0) {
      // If packages exist but no prices, generate a basic price list
      const prices = currentPackages.map((p) => calculatePriceFromPackage(p, 0.5));
      await pool.query('UPDATE games SET package_prices = $1 WHERE id = $2', [JSON.stringify(prices), row.id]);
      updatedPackages++;
    }
  }

  return { updatedImages, updatedPackages };
}

async function seedCategories(imageIndex) {
  const res = await pool.query('SELECT id, name, slug, image FROM categories');

  let updated = 0;
  for (const row of res.rows) {
    if (isBlank(row.image) || String(row.image).includes('placeholder')) {
      const nextImage = pickImageForEntity({ slug: row.slug, name: row.name }, imageIndex);
      if (nextImage) {
        await pool.query('UPDATE categories SET image = $1 WHERE id = $2', [nextImage, row.id]);
        updated++;
      }
    }
  }
  return { updated };
}

async function main() {
  console.log('Seeding DB images + packages...');

  const copied = copyRootImagesIntoPublic();
  if (copied) console.log(`Copied ${copied} image(s) from repo root into backend/public.`);

  const imageIndex = buildPublicImageIndex();
  console.log(`Indexed ${imageIndex.size} image keys from backend/public.`);

  const gameResult = await seedGames(imageIndex);
  const catResult = await seedCategories(imageIndex);

  console.log('Done.');
  console.log(`Games updated (images): ${gameResult.updatedImages}`);
  console.log(`Games updated (packages/prices): ${gameResult.updatedPackages}`);
  console.log(`Categories updated (images): ${catResult.updated}`);

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try { await pool.end(); } catch {}
  process.exit(1);
});
