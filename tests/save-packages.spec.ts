import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function getAdminToken() {
  try {
    const authPath = path.join(process.cwd(), 'playwright/.auth/admin.json');
    if (!fs.existsSync(authPath)) return null;
    const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const origin = authData.origins.find((o: any) => o.origin.includes('localhost'));
    const tokenEntry = origin?.localStorage.find((l: any) => l.name === 'adminToken');
    return tokenEntry?.value;
  } catch (e) {
    return null;
  }
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
  test.beforeAll(() => {
    // Ensure we have a token
    const token = getAdminToken();
    if (!token) {
      console.warn('No admin token found in playwright/.auth/admin.json. Tests might fail.');
    }
  });

  test('PUT /api/games/:id/packages persists quantity derived from amount', async ({ request }) => {
    const game = await getFirstGame(request);
    const token = getAdminToken();
    expect(token).toBeTruthy();

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
  
  test('PUT /api/games/:id/packages rejects too-long duration and rolls back', async ({ request }) => {
    const game = await getFirstGame(request);
    const token = getAdminToken();
    const beforeRes = await request.get(`/api/games/${game.id}/packages`);
    expect(beforeRes.ok()).toBeTruthy();
    const beforeItems = await beforeRes.json();
    const invalid = (Array.isArray(beforeItems) ? beforeItems : []).map((p: any) => ({
      amount: String(p.amount || ''),
      price: Number(p.price || 0),
      discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
      image: p.image || null,
      value: p.value ?? null,
      duration: 'x'.repeat(100),
      description: p.description || null
    }));
    const putRes = await request.put(`/api/games/${game.id}/packages`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { packages: invalid }
    });
    expect(putRes.status()).toBe(400);
    const afterRes = await request.get(`/api/games/${game.id}/packages`);
    expect(afterRes.ok()).toBeTruthy();
    const afterItems = await afterRes.json();
    expect(JSON.stringify(afterItems)).toBe(JSON.stringify(beforeItems));
  });
  
  test('Description is persisted and truncated at 500 chars', async ({ request }) => {
    const game = await getFirstGame(request);
    const token = getAdminToken();
    const initial = await request.get(`/api/games/${game.id}/packages`);
    expect(initial.ok()).toBeTruthy();
    const initialItems = await initial.json();
    const longDesc = 'D'.repeat(600);
    const next = (Array.isArray(initialItems) && initialItems.length ? initialItems.slice(0, 1) : [{
      amount: '1000 ZP', price: 50, discountPrice: null, image: null, value: null, duration: '30 days', description: ''
    }]).map((p: any) => ({ ...p, description: longDesc }));
    const putRes = await request.put(`/api/games/${game.id}/packages`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { packages: next }
    });
    expect(putRes.ok()).toBeTruthy();
    const after = await request.get(`/api/games/${game.id}/packages`);
    expect(after.ok()).toBeTruthy();
    const afterItems = await after.json();
    const found = afterItems.find((p: any) => String(p.description || '').length > 0);
    expect(found).toBeTruthy();
    expect(String(found.description).length).toBeLessThanOrEqual(500);
  });

  test('Invalid quantity triggers rollback and leaves packages unchanged', async ({ request }) => {
    const game = await getFirstGame(request);
    const token = getAdminToken();
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
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('Edit package amount and auto-save shows success', async ({ page }) => {
    await page.getByRole('tab', { name: /Packages/i }).click();
    await page.getByRole('button', { name: /Manage Packages/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /Edit Packages/i });
    await expect(dialog).toBeVisible();
    const amountInput = dialog.getByLabel(/Amount/i).first();
    await amountInput.fill('١٠٠٠ ZP');
    await dialog.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText(/Saved/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Close/i }).first().click({ force: true });
    await expect(dialog).toBeHidden();
  });

  test('Save validation prevents invalid values and confirms persistence', async ({ page, request }) => {
    await page.getByRole('tab', { name: /Packages/i }).click();
    await page.getByRole('button', { name: /Manage Packages/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /Edit Packages/i });
    await expect(dialog).toBeVisible();
    const priceInput = dialog.getByLabel(/Price/i).first();
    await priceInput.fill('-5');
    await dialog.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText(/Invalid values/i).first()).toBeVisible();
    await priceInput.fill('200');
    await dialog.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText(/Saved/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Close/i }).first().click({ force: true });
  });
});
