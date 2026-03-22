import { test, expect } from '@playwright/test';

test.describe('Checkout place order flow', () => {
  test('completes checkout and handles place order without frontend errors', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'checkout_package',
        JSON.stringify({
          gameId: 'test-game-id',
          gameName: 'Test Game',
          packageName: 'Starter Pack',
          packageIndex: 0,
          price: 100,
          gameImage: '/logo.png',
        }),
      );
    });

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'settings-1',
          primaryColor: '#0066FF',
          accentColor: '#FFCC00',
          logoUrl: null,
          headerImageUrl: null,
          whatsappNumber: '201000000000',
          facebookUrl: null,
          trustBadges: [],
          footerText: 'Test footer',
        }),
      });
    });

    await page.route('**/api/orders', async (route) => {
      const body = await route.request().postDataJSON();

      expect(body.items?.length).toBeGreaterThan(0);
      expect(body.total_amount).toBeTruthy();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'order-123',
          status: 'processing',
          token: 'test-token',
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      });
    });

    await page.goto('/checkout');

    const continueGuestButton = page.getByRole('button', { name: /continue as guest/i });
    await continueGuestButton.click();

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/phone number/i).fill('1012345678');

    await page.getByRole('button', { name: /continue to payment/i }).click();

    const firstMethod = page.getByRole('radio').first();
    await firstMethod.click();

    const uploadLabel = page.getByText(/upload payment receipt/i);
    await uploadLabel.scrollIntoViewIfNeeded();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'receipt.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71]),
    });

    await page.getByRole('button', { name: /review order/i }).click();

    await expect(page.getByRole('heading', { name: /review your order/i })).toBeVisible();

    const promise = page.waitForNavigation({ url: /\/account\/orders/ });

    await page.getByRole('button', { name: /place order/i }).click();

    await promise;

    await expect(page).toHaveURL(/\/account\/orders/);
  });
});

