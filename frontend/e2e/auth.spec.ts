import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Medical Clearance System/);
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should navigate to role selection after login', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to role selection or dashboard
    await expect(page).toHaveURL(/\/(role-selection|dashboard)/);
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.error-message')).toContainText(/invalid/i);
  });
});