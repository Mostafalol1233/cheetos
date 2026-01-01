import { test, expect } from '@playwright/test';

test.describe('Games Page', () => {
  test('should display games grid and navigate to game details', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /games/i, level: 1 })).toBeVisible();
    
    // Wait for games to load (skeleton disappears)
    // Using a more generic wait for network or specific element is safer, but checking for cards is good
    await expect(page.locator('a[href^="/game/"]').first()).toBeVisible({ timeout: 10000 });
    
    // Get the first game card
    const firstCard = page.locator('a[href^="/game/"]').first();
    
    // Get title from the card
    const titleElement = firstCard.locator('h3');
    await expect(titleElement).toBeVisible();
    const gameTitle = await titleElement.textContent();
    
    // Click the card (not the button)
    // We click the image area to ensure we are hitting the link part
    await firstCard.locator('img').click();
    
    // Verify URL matches /game/[slug]
    await expect(page).toHaveURL(/\/game\/.+/);
  });

  test('should add item to cart without navigating', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('a[href^="/game/"]').first()).toBeVisible();

    // Find a card
    const card = page.locator('a[href^="/game/"]').first();
    
    // Find the Add to Cart button inside the card
    // The button has SR-only text "add" or "added"
    const addBtn = card.getByRole('button', { name: /add/i });
    
    // Click the button
    await addBtn.click();
    
    // Verify we stayed on the same page
    await expect(page).toHaveURL(/\/games/);
    
    // Verify toast appears
    // The toast contains "added to cart" text
    await expect(page.getByText(/added to cart/i)).toBeVisible();
  });
});
