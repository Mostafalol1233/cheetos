import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as https from 'https';

function isImageFile(name) {
  return /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(name);
}

function listFilesRecursive(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...listFilesRecursive(p));
      } else if (entry.isFile() && isImageFile(entry.name)) {
        results.push(p);
      }
    }
  } catch {}
  return results;
}

function fileHash(filePath) {
  try {
    const hash = crypto.createHash('sha1');
    const buf = fs.readFileSync(filePath);
    hash.update(buf);
    return hash.digest('hex');
  } catch {
    return null;
  }
}

function buildMultipartWithFile(formFields, filePath, filename) {
  const boundary = '----TraeForm' + Math.random().toString(36).slice(2);
  const chunks = [];
  for (const [k, v] of Object.entries(formFields)) {
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

function loadCache(cacheFile) {
  try {
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    }
  } catch {}
  return { files: {} };
}

function saveCache(cacheFile, cache) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  } catch {}
}

export async function initImageProcessor({ app, pool, memStorage, paths }) {
  const {
    imagesDir,
    publicDir,
    generatedImagesDir,
    assetsDir,
    attachedAssetsDir,
    rootAttachedAssetsDir,
    uploadDir
  } = paths;

  const CACHE_FILE = path.join(publicDir, '..', 'data', 'image-cache.json');
  const cache = loadCache(CACHE_FILE);

  let status = {
    startedAt: Date.now(),
    processed: 0,
    skipped: 0,
    errors: 0,
    running: false,
    lastRunAt: null
  };

  async function processOne(filePath) {
    const base = path.basename(filePath);
    const currentHash = fileHash(filePath);
    const prev = cache.files[filePath];
    if (prev && prev.hash === currentHash && prev.url) {
      status.skipped += 1;
      return { ok: true, skipped: true, url: prev.url, filename: base };
    }
    const up = await catboxFileUploadFromLocal(filePath, base);
    if (!up.ok || !up.url) {
      status.errors += 1;
      try {
        await pool.query('INSERT INTO seller_alerts (id, type, summary) VALUES ($1, $2, $3)', [
          `al_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
          'image_error',
          `Catbox upload failed (${filePath}): ${String(up.message || 'unknown')}`.slice(0, 200)
        ]);
      } catch {}
      return { ok: false, error: up.message || 'upload failed', filename: base };
    }
    cache.files[filePath] = { hash: currentHash, url: up.url, filename: base, uploadedAt: Date.now() };
    saveCache(CACHE_FILE, cache);
    try {
      await pool.query(
        'INSERT INTO image_assets (id, url, original_filename, source, related_type, related_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [`img_${Date.now()}_${Math.random().toString(36).slice(2,9)}`, up.url, base, 'catbox', 'file', filePath]
      );
    } catch {}
    status.processed += 1;

    // Seed into application: update any game/category using same filename
    try {
      const gRows = await pool.query('SELECT id, image FROM games');
      for (const g of gRows.rows) {
        const img = String(g.image || '');
        if (img.endsWith('/' + base)) {
          await pool.query('UPDATE games SET image = $1, image_url = $1 WHERE id = $2', [up.url, g.id]);
        }
      }
    } catch {}
    try {
      const cRows = await pool.query('SELECT id, image FROM categories');
      for (const c of cRows.rows) {
        const img = String(c.image || '');
        if (img.endsWith('/' + base)) {
          await pool.query('UPDATE categories SET image = $1 WHERE id = $2', [up.url, c.id]);
        }
      }
    } catch {}

    // Update mem storage if present
    try {
      if (memStorage && typeof memStorage.getGames === 'function') {
        const games = await memStorage.getGames();
        for (const g of games) {
          if (String(g.image || '').endsWith('/' + base)) {
            await memStorage.updateGame(g.id, { image: up.url });
          }
        }
      }
    } catch {}

    return { ok: true, url: up.url, filename: base };
  }

  async function processAll() {
    status.running = true;
    try {
      const dirs = [
        imagesDir,
        publicDir,
        generatedImagesDir,
        assetsDir,
        attachedAssetsDir,
        rootAttachedAssetsDir,
        uploadDir
      ].filter(Boolean);
      const files = dirs.flatMap(listFilesRecursive);
      const uniqueFiles = Array.from(new Set(files));
      const CONCURRENCY = 2;
      let index = 0;
      async function worker() {
        while (index < uniqueFiles.length) {
          const i = index++;
          const f = uniqueFiles[i];
          try {
            await processOne(f);
          } catch (err) {
            status.errors += 1;
          }
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    } finally {
      status.running = false;
      status.lastRunAt = Date.now();
    }
  }

  // Public endpoints
  app.get('/api/images/processed', async (req, res) => {
    try {
      const r = await pool.query('SELECT id, url, original_filename, source, related_type, related_id, uploaded_at FROM image_assets ORDER BY uploaded_at DESC LIMIT 500');
      res.json({ ok: true, items: r.rows });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  app.get('/api/images/processor/status', (req, res) => {
    res.json({ ok: true, status });
  });

  // Kick off asynchronously on server start
  setTimeout(() => {
    processAll().catch(() => {});
  }, 0);
}

