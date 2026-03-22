import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // Perform authentication steps.
  // Replace with your actual admin login URL and credentials.
  await page.goto('/admin/login');
  
  await page.getByLabel('Email Address').fill('admin@diaaldeen.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL('/admin');
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByText('Diaa Eldeen Admin Dashboard')).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
