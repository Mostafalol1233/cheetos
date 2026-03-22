import { test, expect } from '@playwright/test';

test.describe('Image rendering and visual checks', () => {
  test.beforeEach(async ({ page }) => {
    const mockGames = [
      {
        id: 'g1', name: 'Mock Game 1', slug: 'mock1', description: 'desc', price: '0', stock: 10,
        image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="black"/></svg>'
      },
      {
        id: 'g2', name: 'Broken Image', slug: 'mock2', description: 'desc', price: '0', stock: 10,
        image: '/missing.png'
      }
    ];
    await page.route('**/api/games*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockGames) }));
    await page.route('**/api/games/popular', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockGames) }));
    await page.route('**/api/categories', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
  });

  test('games page loads and shows images', async ({ page }) => {
    await page.goto('/games?mock=1');
    const images = page.locator('img[data-testid="game-image"]');
    await expect(images.first()).toBeVisible();
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('images preserve aspect ratio via object-fit contain', async ({ page }) => {
    await page.goto('/games?mock=1');
    const img = page.locator('img[data-testid="game-image"]').first();
    await expect(img).toBeVisible();
    const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('contain');
  });

  test('fallback shows when image fails to load', async ({ page }) => {
    await page.goto('/games?mock=1');
    const broken = page.locator('img[data-testid="game-image"][data-src*="missing.png"]').first();
    await expect(broken).toBeVisible();
    await expect.poll(async () => (await broken.getAttribute('src')) || '').toContain('data:image/svg+xml');
  });

  test('images have acceptable dimensions', async ({ page }) => {
    await page.goto('/games?mock=1');
    const img = page.locator('img[data-testid="game-image"]').first();
    await expect(img).toBeVisible();
    const dims = await img.evaluate((el) => ({
      w: (el as HTMLImageElement).naturalWidth,
      h: (el as HTMLImageElement).naturalHeight
    }));
    expect(dims.w).toBeGreaterThanOrEqual(200);
    expect(dims.h).toBeGreaterThanOrEqual(200);
  });

  test('first game image is visible', async ({ page }) => {
    await page.goto('/games?mock=1');
    const firstImage = page.locator('img[data-testid="game-image"]').first();
    await expect(firstImage).toBeVisible();
  });

  test('home popular games show images', async ({ page }) => {
    const mockGames = [
      { id: 'p1', name: 'Popular 1', slug: 'pop1', description: 'd', price: '0', stock: 5, image: 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"300\"><rect width=\"100%\" height=\"100%\" fill=\"black\"/></svg>' },
      { id: 'p2', name: 'Popular 2', slug: 'pop2', description: 'd', price: '0', stock: 5, image: '/missing.png' }
    ];
    await page.route('**/api/games/popular', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockGames) }));
    await page.route('**/api/categories', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.goto('/?mock=1');
    const images = page.locator('img[data-testid=\"game-image\"]');
    await expect(images.first()).toBeVisible();
    const broken = page.locator('img[data-testid=\"game-image\"][data-src*=\"missing.png\"]').first();
    await expect(broken).toBeVisible();
    await expect.poll(async () => (await broken.getAttribute('src')) || '').toContain('data:image/svg+xml');
  });
});
