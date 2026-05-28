import { test, expect } from '@playwright/test';

test.describe('App Shell', () => {
  test('should serve the Angular app without a blank page', async ({ page }) => {
    await page.goto('/');
    // Angular app should render something — not a blank white page
    await expect(page.locator('body')).toContainText(/StudentCare\+|PDMHS|Login|Select your role to continue/i, { timeout: 10000 });
  });

  test('should redirect unauthenticated users away from dashboard', async ({ page }) => {
    await page.goto('/dashboard/admin');
    // Should redirect to login or role-selection, not stay on /dashboard/admin
    await expect(page).not.toHaveURL(/dashboard\/admin/, { timeout: 8000 });
  });

  test('should redirect unauthenticated users from adviser dashboard', async ({ page }) => {
    await page.goto('/dashboard/adviser');
    await expect(page).not.toHaveURL(/dashboard\/adviser/, { timeout: 8000 });
  });

  test('should redirect unauthenticated users from staff dashboard', async ({ page }) => {
    await page.goto('/dashboard/staff');
    await expect(page).not.toHaveURL(/dashboard\/staff/, { timeout: 8000 });
  });
});
