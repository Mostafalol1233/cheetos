import 'dotenv/config';

const BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 3001}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

async function j(res) {
  try { return await res.json(); } catch { return {}; }
}

async function adminLogin() {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const data = await j(res);
  if (!res.ok || !data.token) throw new Error(`Login failed: ${data.message || res.status}`);
  return data.token;
}

async function getGames() {
  const r = await fetch(`${BASE}/api/games`);
  const js = await j(r);
  return Array.isArray(js.items) ? js.items : (Array.isArray(js) ? js : []);
}

async function delGame(idOrSlug, token) {
  try {
    const r = await fetch(`${BASE}/api/games/${idOrSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await j(r);
    return { id: idOrSlug, ok: r.ok, status: r.status, message: d.message || null };
  } catch (e) {
    return { id: idOrSlug, ok: false, error: e.message };
  }
}

async function createGame(payload, token) {
  try {
    const r = await fetch(`${BASE}/api/games`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await j(r);
    return { ok: r.ok, status: r.status, id: d.id, slug: d.slug, error: r.ok ? null : (d.message || null) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function getPackages(idOrSlug, token) {
  try {
    const r = await fetch(`${BASE}/api/games/${idOrSlug}/packages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const arr = await j(r);
    return { ok: r.ok, status: r.status, count: Array.isArray(arr) ? arr.length : 0 };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function exists(idOrSlug) {
  const r = await fetch(`${BASE}/api/games/${idOrSlug}`);
  return { id: idOrSlug, status: r.status, found: r.status !== 404 };
}

async function main() {
  const token = await adminLogin();

  const pre = await getGames();
  const preCount = pre.length;

  const deletions = await Promise.all([
    'valorant-test',
    'gift-card-test',
    'game_1767231279583'
  ].map((id) => delGame(id, token)));

  const valPayload = {
    name: 'Valorant Test',
    price: 360,
    stock: 50,
    category: 'shooters',
    image: '/images/ps-store-64x64.webp',
    packages: ['285 VP', '575 VP'],
    packagePrices: ['260', '410'],
    packageDiscountPrices: ['160', '310']
  };
  const giftPayload = {
    name: 'Gift Card Test',
    price: 100,
    stock: 999,
    category: 'gift_cards',
    image: '/images/Steam-Logo-White_3.png',
    packages: ['10 USD', '25 USD', '50 USD'],
    packagePrices: ['400', '950', '1900'],
    packageDiscountPrices: [null, null, null]
  };

  const c1 = await createGame(valPayload, token);
  const c2 = await createGame(giftPayload, token);

  const p1 = c1.slug ? await getPackages(c1.slug, token) : { ok: false, error: 'no slug c1' };
  const p2 = c2.slug ? await getPackages(c2.slug, token) : { ok: false, error: 'no slug c2' };

  const post = await getGames();
  const postCount = post.length;

  const notFound = await Promise.all([
    'valorant-test',
    'gift-card-test',
    'game_1767231279583'
  ].map(exists));

  const summary = {
    base: BASE,
    preCount,
    postCount,
    deleted: deletions,
    created: [c1, c2],
    packages: { valorant: p1, gift: p2 },
    notFoundAfterDelete: notFound
  };

  console.log(JSON.stringify(summary));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
});

