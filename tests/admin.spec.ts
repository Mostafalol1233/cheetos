import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('tabs render and logo management is accessible', async ({ page }) => {
    await expect(page.getByText('Diaa Eldeen Admin Dashboard')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Logo/i })).toBeVisible();
    await page.getByRole('tab', { name: /Logo/i }).click();
    await expect(page.getByText(/Logo Settings/i)).toBeVisible();
    await expect(page.getByLabel(/Small Logo/i)).toBeVisible();
    await expect(page.getByLabel(/Large Logo/i)).toBeVisible();
    await expect(page.getByLabel(/Favicon/i)).toBeVisible();
  });

  test('games tab loads', async ({ page }) => {
    await page.getByRole('tab', { name: /Games & Products/i }).click();
    await expect(page.getByText(/Manage Games/i)).toBeVisible();
  });

  test('core APIs respond', async ({ request }) => {
    const resGames = await request.get('/api/games');
    expect([200]).toContain(resGames.status());

    const resCats = await request.get('/api/categories');
    expect([200]).toContain(resCats.status());

    const resLogo = await request.get('/api/admin/logo/config');
    expect([200, 401, 403]).toContain(resLogo.status());
  });
});
