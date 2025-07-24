import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PLANT_NAME = 'E2E Planta ' + Date.now();
const TEST_PLANT_NICK = 'E2E Nick';
const TEST_IMAGE_PATH = path.resolve(__dirname, '../fixtures/test-plant.jpg');

test.describe('Plant Creation Flow', () => {
  test('should allow user to create a new plant and see it in the dashboard', async ({ page }) => {
    await page.goto('/');

    // Botón Agregar planta
    await page.click('button:has-text("Agregar planta"), button:has-text("Añadir planta"), [aria-label*="Agregar planta"]');

    // Completar formulario
    await page.fill('input[placeholder*="Nombre" i]', TEST_PLANT_NAME);
    await page.fill('input[placeholder*="Apodo" i]', TEST_PLANT_NICK);

    // Subir imagen si el campo existe
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
    }

    // Enviar formulario
    await page.click('button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]');

    // Esperar a que la planta aparezca en el dashboard/lista
    await expect(page.locator('.plant-card, [data-testid="plant-card"]')).toContainText(TEST_PLANT_NAME, { timeout: 15_000 });
  });
}); 