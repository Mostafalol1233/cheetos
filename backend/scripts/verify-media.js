import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cloudinaryModule from 'cloudinary';
import pkg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const cloudinary = cloudinaryModule.v2 || cloudinaryModule;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_CONNECTION_STRING,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

const publicDir = path.join(__dirname, '..', 'public');
const imagesDir = path.join(__dirname, '..', '..', 'images');

const mode = process.argv.includes('--upload') ? 'upload' : 'verify';
console.log(mode === 'upload' ? 'Uploading media assets to Cloudinary...' : 'Checking media assets...');

async function getGames() {
  const rows = await pool.query('SELECT id, name, image FROM games ORDER BY id ASC');
  return rows.rows;
}

function fileExistsRel(relPath) {
  const cleaned = relPath.replace(/^\//, '');
  const candidates = [
    path.join(publicDir, cleaned),
    path.join(imagesDir, cleaned),
    path.join(publicDir, path.basename(cleaned)),
    path.join(imagesDir, path.basename(cleaned)),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  let missing = 0;
  let found = 0;
  let uploaded = 0;
  let updated = 0;
  const games = await getGames();
  for (const game of games) {
    const rel = String(game.image || '').trim();
    if (!rel) {
      console.warn(`[NO IMAGE] ${game.name}`);
      continue;
    }
    const localPath = fileExistsRel(rel) || null;
    if (mode === 'verify') {
      if (localPath) {
        console.log(`[OK] ${game.name}: ${rel}`);
        found++;
      } else {
        console.error(`[MISSING] ${game.name}: ${rel}`);
        missing++;
      }
      continue;
    }
    if (!cloudinary.config().cloud_name) {
      console.error('Cloudinary not configured. Set CLOUDINARY_* env vars.');
      process.exit(1);
    }
    if (!localPath && /^https?:\/\//i.test(rel)) {
      console.log(`[SKIP] ${game.name}: already external URL`);
      continue;
    }
    try {
      const res = await cloudinary.uploader.upload(localPath || rel, { folder: 'gamecart' });
      const url = res.secure_url || res.url;
      if (url) {
        await pool.query('UPDATE games SET image = $1 WHERE id = $2', [url, game.id]);
        console.log(`[UPDATED] ${game.name}: ${url}`);
        uploaded++;
        updated++;
      } else {
        console.error(`[FAILED] Upload ${game.name}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${game.name}: ${err?.message || err}`);
    }
  }
  console.log(`\nSummary: found=${found}, missing=${missing}, uploaded=${uploaded}, updated=${updated}`);
  process.exit(missing > 0 && mode === 'verify' ? 1 : 0);
}

main().catch((err) => {
  console.error('Script error:', err?.message || err);
  process.exit(1);
});
