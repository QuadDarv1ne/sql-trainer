import { test, expect } from '@playwright/test';

test.describe('Password reset flow', () => {
  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText(/password|reset/i)).toBeVisible({ timeout: 10000 });
  });

  test('forgot-password form has email input', async ({ page }) => {
    await page.goto('/forgot-password');
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('forgot-password submit with empty email shows error', async ({ page }) => {
    await page.goto('/forgot-password');
    const submitButton = page.getByRole('button', { name: /submit|reset|send/i });
    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click();
      await expect(page.getByText(/error|required|invalid/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Login page', () => {
  test('login page loads with form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/sign in|login|log in/i)).toBeVisible({ timeout: 10000 });
  });

  test('login form has email and password fields', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByRole('textbox', { name: /password/i });
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByRole('textbox', { name: /password/i });
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('wrongpassword123');
    const submitButton = page.getByRole('button', { name: /sign in|login|log in/i });
    await submitButton.click();
    await expect(page.getByText(/error|invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Registration page', () => {
  test('register page loads with form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText(/sign up|register|create/i)).toBeVisible({ timeout: 10000 });
  });

  test('register form has required fields', async ({ page }) => {
    await page.goto('/register');
    const nameInput = page.getByRole('textbox', { name: /name/i });
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toBeVisible();
  });
});
