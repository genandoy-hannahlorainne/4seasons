import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load the app and redirect to login or role selection', async ({ page }) => {
    await page.goto('/');
    // App should load without crashing — either role-selection or login
    await expect(page).toHaveURL(/\/(role-selection|login|$)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display the login page for a specific role', async ({ page }) => {
    await page.goto('/login/student');
    await expect(page.locator('body')).toBeVisible();
    // Username input should be present (not email)
    const usernameInput = page.locator('input[type="text"], input[placeholder*="username" i], input[name="username"]');
    await expect(usernameInput.first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login/student');

    const usernameInput = page.locator('input[type="text"], input[placeholder*="username" i], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await usernameInput.fill('invalid_user_xyz');
    await passwordInput.fill('wrongpassword');
    await submitBtn.click();

    // Should show some error — either inline or a toast
    await expect(page.locator('body')).toContainText(/invalid|incorrect|error|failed/i, { timeout: 8000 });
  });
});
