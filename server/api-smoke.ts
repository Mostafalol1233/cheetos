import http from 'http';

const BASE = process.env.BASE_URL || 'http://localhost:5000';

function get(path: string): Promise<{ status: number; ok: boolean; body: string }> {
  return new Promise((resolve) => {
    try {
      const req = http.request(`${BASE}${path}`, { method: 'GET' }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 0, ok: (res.statusCode || 0) < 400, body: data }));
      });
      req.on('error', () => resolve({ status: 0, ok: false, body: '' }));
      req.end();
    } catch {
      resolve({ status: 0, ok: false, body: '' });
    }
  });
}

async function run() {
  const checks = [
    '/api/games',
    '/api/games/popular',
    '/api/games/category/shooters',
    '/api/games/slug/roblox',
    '/api/games/id/game_4',
    '/api/categories',
    '/api/contact-info',
    '/api/games/hot-deals',
  ];
  let pass = 0;
  for (const path of checks) {
    const res = await get(path);
    const ok = res.ok;
    console.log(`${ok ? 'OK' : 'FAIL'} ${path} -> ${res.status}`);
    if (ok) pass++;
  }
  if (pass < checks.length) {
    process.exitCode = 1;
  }
}

run();

