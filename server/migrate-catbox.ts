import { db, pool } from "./db";
import { games, categories } from "@shared/schema";
import * as https from "https";

function isCatboxUrl(url: string) {
  try {
    const u = new URL(String(url || '').trim());
    return u.hostname === 'files.catbox.moe' || u.hostname === 'catbox.moe';
  } catch {
    return false;
  }
}

async function httpsPostForm(hostname: string, pathUrl: string, form: Record<string, string>) {
  const boundary = '----TraeForm' + Math.random().toString(36).slice(2);
  const payload = Object.entries(form).map(([k, v]) => {
    return `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
  }).join('') + `--${boundary}--\r\n`;
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = https.request({
      method: 'POST', hostname, path: pathUrl,
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function uploadUrlToCatbox(srcUrl: string) {
  const resp = await httpsPostForm('catbox.moe', '/user/api.php', { reqtype: 'urlupload', url: srcUrl });
  const body = String(resp.body || '').trim();
  if (resp.status >= 200 && resp.status < 300 && body.startsWith('https://')) {
    return { ok: true, url: body };
  }
  return { ok: false, status: resp.status, message: body || 'Upload failed' };
}

export async function migrateAllToCatbox() {
  const siteBase = process.env.BACKEND_URL || 'http://localhost:3001';
  const toFullUrl = (p: string | null) => {
    const s = String(p || '').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    return `${siteBase}${s}`.replace(/\/\/+/g, '/').replace(/^http:\//, 'http://');
  };
  const results = { games: 0, categories: 0, errors: 0, updated: 0 };
  const gRows = await pool.query('SELECT id, slug, image FROM games');
  for (const g of gRows.rows) {
    const img = String(g.image || '');
    if (img && !isCatboxUrl(img)) {
      try {
        const full = toFullUrl(img);
        if (!full) continue;
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
    const img = String(c.image || '');
    if (img && !isCatboxUrl(img)) {
      try {
        const full = toFullUrl(img);
        if (!full) continue;
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
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllToCatbox()
    .then((r) => { console.log('Migration done:', r); process.exit(0); })
    .catch((e) => { console.error('Migration failed:', e); process.exit(1); });
}

