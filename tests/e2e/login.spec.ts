import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'password123';

test.describe('Login Flow', () => {
  test('should allow user to login and access dashboard', async ({ page }) => {
    await page.goto('/');

    // Verifica h1 Plantitas
    await expect(page.locator('h1')).toContainText(/Plantitas/i);

    // Si hay formulario de login
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button:has-text("Iniciar Sesión")');
      // Espera a que desaparezca el formulario y aparezca el dashboard
      await expect(page.locator('h1')).not.toContainText(/Plantitas/i, { timeout: 10_000 });
      await expect(page.locator('.plant-card, [data-testid="plant-card"]')).toBeVisible({ timeout: 10_000 });
    } else {
      // Si ya está autenticado, debe ver cards de plantas
      await expect(page.locator('.plant-card, [data-testid="plant-card"]')).toBeVisible({ timeout: 10_000 });
    }
  });
}); 