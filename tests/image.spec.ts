import { test, expect } from '@playwright/test';

test.describe('Image rendering and visual checks', () => {
  test('home page loads and shows images', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img[data-testid="game-image"]');
    await expect(images.first()).toBeVisible();
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('images preserve aspect ratio via object-fit contain', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('img[data-testid="game-image"]').first();
    await expect(img).toBeVisible();
    const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('contain');
  });

  test('fallback shows when image fails to load', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('img[data-testid="game-image"]').first();
    await expect(img).toBeVisible();
    const originalSrc = await img.getAttribute('data-src');

    let intercepted = false;
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (!intercepted && originalSrc && url.includes(originalSrc.replace(/^\//, ''))) {
        intercepted = true;
        return route.abort();
      }
      route.continue();
    });

    // Force reload of the image to trigger error
    await img.evaluate((el) => {
      const src = (el as HTMLImageElement).getAttribute('data-src') || '';
      (el as HTMLImageElement).src = src;
    });

    await expect.poll(async () => (await img.getAttribute('src')) || '').toContain('data:image/svg+xml');
  });

  test('visual regression: hero section and first game image', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveScreenshot('home-hero.png');

    const firstImage = page.locator('img[data-testid="game-image"]').first();
    await expect(firstImage).toHaveScreenshot('popular-first-image.png');
  });
});
