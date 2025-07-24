import { test, expect } from '@playwright/test';

test.describe('Plantitas App - Smoke Test', () => {
  test('should load the home page and display the main title', async ({ page }) => {
    await page.goto('/');
    // Acepta ambos títulos posibles
    await expect(page).toHaveTitle(/Plantitas|PlantCare/i);
    // Busca h1 visible con Plantitas o PlantCare
    await expect(page.locator('h1')).toContainText(/Plantitas|PlantCare/i);
  });
}); 