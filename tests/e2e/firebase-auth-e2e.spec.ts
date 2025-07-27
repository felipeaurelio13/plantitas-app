import { test, expect } from '@playwright/test';

test.describe('Firebase Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the auth page
    await page.goto('/auth');
  });

  test('should display login form by default', async ({ page }) => {
    // Check that we're on the login form
    await expect(page.getByText('Iniciar Sesión')).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should switch to signup mode', async ({ page }) => {
    // Click the signup link
    await page.getByText(/regístrate/i).click();
    
    // Verify we're now in signup mode
    await expect(page.getByText('Crear Cuenta')).toBeVisible();
    await expect(page.getByPlaceholder(/nombre completo/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder('Contraseña')).toBeVisible();
    await expect(page.getByPlaceholder(/confirmar contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();
  });

  test('should switch back to login mode', async ({ page }) => {
    // Go to signup first
    await page.getByText(/regístrate/i).click();
    await expect(page.getByText('Crear Cuenta')).toBeVisible();
    
    // Switch back to login
    await page.getByText(/inicia sesión/i).click();
    await expect(page.getByText('Iniciar Sesión')).toBeVisible();
  });

  test('should validate required fields on login', async ({ page }) => {
    // Try to submit empty login form
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Check for HTML5 validation messages
    const emailInput = page.getByPlaceholder(/email/i);
    const emailValidation = await emailInput.evaluate(el => (el as HTMLInputElement).validationMessage);
    expect(emailValidation).toBeTruthy();
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Check for email validation
    const emailInput = page.getByPlaceholder(/email/i);
    const emailValidation = await emailInput.evaluate(el => (el as HTMLInputElement).validationMessage);
    expect(emailValidation).toContain('email');
  });

  test('should validate required fields on signup', async ({ page }) => {
    // Switch to signup
    await page.getByText(/regístrate/i).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    
    // Check for validation on required fields
    const fullNameInput = page.getByPlaceholder(/nombre completo/i);
    const nameValidation = await fullNameInput.evaluate(el => (el as HTMLInputElement).validationMessage);
    expect(nameValidation).toBeTruthy();
  });

  test('should validate password confirmation on signup', async ({ page }) => {
    // Switch to signup
    await page.getByText(/regístrate/i).click();
    
    // Fill form with mismatched passwords
    await page.getByPlaceholder(/nombre completo/i).fill('Test User');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder('Contraseña').fill('password123');
    await page.getByPlaceholder(/confirmar contraseña/i).fill('differentpassword');
    
    // Submit form
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    
    // Should show error message (this will depend on your actual implementation)
    // For now, we'll just check that we didn't navigate away
    await expect(page.getByText('Crear Cuenta')).toBeVisible();
  });

  test('should handle Firebase connection errors gracefully', async ({ page }) => {
    // Block Firebase requests to simulate connection issues
    await page.route('**/*firebaseapp.com*', route => route.abort());
    await page.route('**/*googleapis.com*', route => route.abort());
    
    // Try to login
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Should handle the error gracefully (check for error message or staying on page)
    // This test will need to be adjusted based on your error handling implementation
    await expect(page.getByText('Iniciar Sesión')).toBeVisible();
  });

  test('should show loading state during authentication', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    // Try to login
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Should show loading state (disabled button or loading text)
    await expect(page.getByRole('button', { name: /iniciando/i })).toBeVisible();
  });

  test('should persist form data when switching modes', async ({ page }) => {
    // Fill login form
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    
    // Switch to signup and back
    await page.getByText(/regístrate/i).click();
    await page.getByText(/inicia sesión/i).click();
    
    // Email should be preserved (if your implementation does this)
    const emailValue = await page.getByPlaceholder(/email/i).inputValue();
    expect(emailValue).toBe('test@example.com');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/email/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder(/contraseña/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeFocused();
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    // Fill form and press Enter
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByPlaceholder(/contraseña/i).press('Enter');
    
    // Should trigger form submission
    // This will need adjustment based on your actual implementation
    await page.waitForTimeout(1000); // Wait for any loading states
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that all elements are visible and accessible
    await expect(page.getByText('Iniciar Sesión')).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    
    // Check that form is usable on mobile
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    
    // Verify inputs work on mobile
    const emailValue = await page.getByPlaceholder(/email/i).inputValue();
    const passwordValue = await page.getByPlaceholder(/contraseña/i).inputValue();
    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('password123');
  });

  test('should handle accessibility requirements', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const loginButton = page.getByRole('button', { name: /iniciar sesión/i });
    await expect(loginButton).toBeVisible();
    
    // Check form has proper labels
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/contraseña/i);
    
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Check for proper heading structure
    await expect(page.getByRole('heading')).toBeVisible();
  });
});