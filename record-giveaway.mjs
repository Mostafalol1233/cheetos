import { chromium } from '@playwright/test';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_URL = process.env.DATABASE_URL;
const PORT = 5000;
const ORIGINAL_DRAW_TIME = '2026-10-06T22:00:00+03:00';

/* Per-elimination timing (source code already changed):
   CSS spin: 2.5s + pause: 1.5s = ~4s per elimination
   50 eliminations × 4s = 200s + 15s countdown + 20s winner = ~235s
   We wait 280s to be safe. */
const RECORD_SECONDS = 290;

async function updateDrawTime(pool, dt) {
  await pool.query(`UPDATE giveaway_settings SET draw_time = $1`, [dt]);
  console.log(`[DB] draw_time set to: ${dt}`);
}

async function main() {
  const pool = new pg.Pool({ connectionString: DB_URL });

  /* ── 1. Set draw_time to 16s from now ── */
  const future = new Date(Date.now() + 16000);
  const futureStr = future.toISOString().replace('Z', '+00:00');
  await updateDrawTime(pool, futureStr);

  /* ── 2. Wait for Vite HMR to apply source changes ── */
  console.log('[wait] 5s for Vite HMR...');
  await new Promise(r => setTimeout(r, 5000));

  /* ── 3. Launch Playwright with video recording ── */
  fs.mkdirSync('/tmp/recordings', { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: '/tmp/recordings/',
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[page-error]', msg.text());
  });

  console.log(`[browser] Navigating to http://localhost:${PORT}/giveaway?state=3`);
  await page.goto(`http://localhost:${PORT}/giveaway?state=3`, {
    waitUntil: 'networkidle',
    timeout: 20000,
  });
  console.log('[browser] Page loaded. Recording...');

  /* ── 4. Record for full draw duration ── */
  for (let s = 0; s < RECORD_SECONDS; s += 10) {
    await page.waitForTimeout(10000);
    console.log(`[rec] ${s + 10}s / ${RECORD_SECONDS}s`);
  }

  /* ── 5. Get video path and close ── */
  const videoPath = await page.video()?.path();
  await context.close(); // triggers video save
  await browser.close();
  console.log('[browser] Closed. Video at:', videoPath);

  /* ── 6. Restore original draw_time ── */
  await updateDrawTime(pool, ORIGINAL_DRAW_TIME);
  await pool.end();

  /* ── 7. Convert WebM → MP4 and copy to workspace ── */
  if (videoPath && fs.existsSync(videoPath)) {
    const dest = path.join(__dirname, 'giveaway-screenrec.mp4');
    const ffmpeg = '/nix/store/2crh7152ri5v6aarmnw20y73iq5hgj3n-replit-runtime-path/bin/ffmpeg';
    try {
      execSync(`${ffmpeg} -y -i "${videoPath}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${dest}"`, {
        stdio: 'inherit',
      });
      console.log('[done] Saved:', dest);
      const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
      console.log(`[done] Size: ${size} MB`);
    } catch (e) {
      /* fallback: just copy the webm */
      const destWbm = path.join(__dirname, 'giveaway-screenrec.webm');
      fs.copyFileSync(videoPath, destWbm);
      console.log('[done] Saved (WebM fallback):', destWbm);
    }
  } else {
    console.error('[error] No video file found!', videoPath);
  }
}

main().catch(e => {
  console.error('[fatal]', e);
  /* Always try to restore draw_time on failure */
  const pool2 = new pg.Pool({ connectionString: DB_URL });
  pool2.query(`UPDATE giveaway_settings SET draw_time = $1`, [ORIGINAL_DRAW_TIME])
    .finally(() => pool2.end());
  process.exit(1);
});
