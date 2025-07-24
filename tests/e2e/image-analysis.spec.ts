import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGE_PATH = path.resolve(__dirname, '../fixtures/test-plant.jpg');

test.describe('Image Analysis Flow', () => {
  test('should allow user to analyze a new image and see health analysis', async ({ page }) => {
    await page.goto('/');

    // Seleccionar la primera planta
    const plantCard = page.locator('.plant-card, [data-testid="plant-card"]').first();
    await plantCard.click();

    // Botón Agregar foto
    await page.click('button:has-text("Agregar foto"), button:has-text("Añadir imagen"), [aria-label*="Agregar foto"]');

    // Subir imagen
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // Enviar para análisis
    await page.click('button:has-text("Analizar"), button:has-text("Guardar"), button[type="submit"]');

    // Esperar resultado de análisis
    await expect(page.locator('.health-analysis, [data-testid="health-analysis"], .analysis-result')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.health-analysis, [data-testid="health-analysis"], .analysis-result')).toContainText([/salud|recomendaci/i]);
  });
}); 