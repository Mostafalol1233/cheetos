import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJWT(payload: Record<string, any>, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + 3600, ...payload };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

async function getFirstGame(request: any) {
  const res = await request.get('/api/games');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  const items = Array.isArray(json?.items) ? json.items : [];
  expect(items.length).toBeGreaterThan(0);
  return items[0];
}

test.describe('Packages save integration', () => {
  test('PUT /api/games/:id/packages persists quantity derived from amount', async ({ request }) => {
    const game = await getFirstGame(request);
    const token = signJWT({ id: 'test-admin', role: 'admin', email: 'admin@test.local' }, 'your_jwt_secret_key_change_this_in_production');
    const initial = await request.get(`/api/games/${game.id}/packages`);
    expect(initial.ok()).toBeTruthy();
    const initialItems = await initial.json();
    const next = Array.isArray(initialItems) && initialItems.length
      ? initialItems.slice(0, 2).map((p: any) => ({
          amount: '5000 ZP',
          price: Number(p.price || 0),
          discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
          image: p.image || null,
          value: null,
          duration: '30 days',
          description: 'Test package'
        }))
      : [{
          amount: '5000 ZP',
          price: 100,
          discountPrice: null,
          image: null,
          value: null,
          duration: '30 days',
          description: 'Test package'
        }];
    const putRes = await request.put(`/api/games/${game.id}/packages`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { packages: next }
    });
    expect(putRes.ok()).toBeTruthy();
    const after = await request.get(`/api/games/${game.id}/packages`);
    expect(after.ok()).toBeTruthy();
    const afterItems = await after.json();
    const found = afterItems.find((p: any) => String(p.amount).includes('5000'));
    expect(found).toBeTruthy();
    expect(Number(found.value || 0)).toBe(5000);
  });

  test('Invalid quantity triggers rollback and leaves packages unchanged', async ({ request }) => {
    const game = await getFirstGame(request);
    const token = signJWT({ id: 'test-admin', role: 'admin', email: 'admin@test.local' }, 'your_jwt_secret_key_change_this_in_production');
    const beforeRes = await request.get(`/api/games/${game.id}/packages`);
    expect(beforeRes.ok()).toBeTruthy();
    const beforeItems = await beforeRes.json();
    const invalidUpdate = (Array.isArray(beforeItems) ? beforeItems : []).map((p: any) => ({
      amount: String(p.amount || ''),
      price: Number(p.price || 0),
      discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
      image: p.image || null,
      value: 0,
      duration: p.duration || null,
      description: p.description || null
    }));
    const putRes = await request.put(`/api/games/${game.id}/packages`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { packages: invalidUpdate }
    });
    expect(putRes.status()).toBe(400);
    const afterRes = await request.get(`/api/games/${game.id}/packages`);
    expect(afterRes.ok()).toBeTruthy();
    const afterItems = await afterRes.json();
    expect(JSON.stringify(afterItems)).toBe(JSON.stringify(beforeItems));
  });
});

test.describe('Admin UI package editing', () => {
  test.beforeEach(async ({ page }) => {
    const token = signJWT({ id: 'test-admin', role: 'admin', email: 'admin@test.local' }, 'your_jwt_secret_key_change_this_in_production');
    await page.addInitScript((t) => { localStorage.setItem('adminToken', t as string); }, token);
    await page.goto('/admin');
  });

  test('Edit package amount and auto-save shows success', async ({ page }) => {
    await page.getByRole('tab', { name: /Packages/i }).click();
    await page.getByRole('button', { name: /Manage Packages/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /Edit Packages/i });
    await expect(dialog).toBeVisible();
    const amountInput = dialog.getByLabel(/Amount/i).first();
    await amountInput.fill('١٠٠٠ ZP');
    await amountInput.blur();
    await expect(page.getByText(/Saved/i)).toBeVisible();
    await page.getByRole('button', { name: /Close/i }).click();
  });
}
