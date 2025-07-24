import { test, expect } from '@playwright/test';

test.describe('Settings & Accessibility Flow', () => {
  test('should allow user to change theme and accessibility settings', async ({ page }) => {
    await page.goto('/');

    // Navegar a settings
    await page.click('a:has-text("Configuración"), [aria-label*="Configuración"]');
    await expect(page.locator('h1')).toContainText(/Configuración/i);

    // Cambiar tema (oscuro/claro)
    const themeToggle = page.locator('button[aria-label*="tema" i], button:has-text("Oscuro"), button:has-text("Claro")');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Verificar cambio de clase o atributo en body/html
      await expect(page.locator('body, html')).toHaveClass(/dark|oscuro|light|claro/i);
    }

    // Cambiar preferencia de accesibilidad (ej: alto contraste)
    const a11yToggle = page.locator('button[aria-label*="accesibilidad" i], button:has-text("Alto contraste")');
    if (await a11yToggle.isVisible()) {
      await a11yToggle.click();
      await expect(page.locator('body, html')).toHaveClass(/contrast|accesibilidad/i);
    }
  });
}); 