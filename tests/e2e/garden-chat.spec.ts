import { test, expect } from '@playwright/test';

test.describe('Garden Chat Flow', () => {
  test('should allow user to send a message and receive a response from the assistant', async ({ page }) => {
    await page.goto('/');

    // Navegar a la sección de chat del jardín
    await page.click('a:has-text("Chat"), a:has-text("Chat del jardín"), [aria-label*="Chat"]');

    // Escribir y enviar mensaje
    const input = page.locator('input[placeholder*="mensaje" i], textarea[placeholder*="mensaje" i]');
    await input.fill('¿Cómo están mis plantas?');
    await page.click('button:has-text("Enviar"), button[type="submit"]');

    // Esperar respuesta del asistente
    await expect(page.locator('.message-bubble.assistant, [data-testid="assistant-message"], .ai-response')).toContainText([/plantas|salud|riego|recom/i], { timeout: 15_000 });
  });
}); 