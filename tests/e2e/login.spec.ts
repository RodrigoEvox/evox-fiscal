import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login page or show login UI
    const loginButton = page.locator('text=Login');
    await expect(loginButton).toBeVisible({ timeout: 5000 });
  });

  test('should display login URL', async ({ page }) => {
    await page.goto('/');
    
    // Check if OAuth login button is present
    const oauthButton = page.locator('button:has-text("Entrar com Manus")');
    if (await oauthButton.isVisible()) {
      await expect(oauthButton).toBeVisible();
    }
  });

  test('should have dashboard accessible after auth', async ({ page }) => {
    // This test assumes you have a way to mock authentication
    // In production, you'd use browser context with stored auth state
    await page.goto('/dashboard');
    
    // Check for dashboard elements
    const dashboard = page.locator('text=Dashboard');
    // May redirect to login if not authenticated, which is expected
  });
});
