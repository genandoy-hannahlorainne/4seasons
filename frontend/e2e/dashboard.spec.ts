import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    // Add authentication setup here when auth is implemented
  });

  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test navigation menu
    await page.click('text=Students');
    await expect(page).toHaveURL(/students/);
    
    await page.click('text=Medical Visits');
    await expect(page).toHaveURL(/medical-visits/);
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if user info is displayed
    await expect(page.locator('.user-info')).toBeVisible();
  });
});