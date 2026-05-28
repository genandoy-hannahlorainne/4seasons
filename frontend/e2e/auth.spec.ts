import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('selectedRole', 'student');
    });
    await page.route('**/api/me', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' })
      });
    });
  });

  test('should load the app and redirect to login or role selection', async ({ page }) => {
    await page.goto('/');
    // App should load without crashing — either role-selection or login
    await expect(page).toHaveURL(/\/(role-selection|login|$)/);
    await expect(page.locator('body')).toContainText(/StudentCare\+|PDMHS|Login|Select your role to continue/i, { timeout: 10000 });
  });

  test('should display the login page for a specific role', async ({ page }) => {
    await page.goto('/login/student');
    await expect(page).toHaveURL(/\/login\/student/);
    await expect(page.locator('body')).toContainText(/Sign in to your account|Student Login|Login/i, { timeout: 10000 });
    // Username input should be present (not email)
    const usernameInput = page.locator('input[type="text"], input[placeholder*="username" i], input[name="username"]');
    await expect(usernameInput.first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login/student');
    await expect(page).toHaveURL(/\/login\/student/);

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
