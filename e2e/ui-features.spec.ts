import { test, expect } from '@playwright/test';

test.describe('Navigation and theme', () => {
  test('landing page shows main UI elements', async ({ page }) => {
    await page.goto('/');
    // Welcome text or app title
    await expect(page.getByText(/SQL|Trainer/i)).toBeVisible({ timeout: 10000 });
    // CodeMirror editor should be present
    await expect(page.locator('.cm-content').first()).toBeVisible();
  });

  test('dark/light theme toggle works', async ({ page }) => {
    await page.goto('/');
    // Find theme toggle button (sun/moon icon or "theme" text)
    const themeButton = page.getByRole('button', { name: /theme/i });
    if (await themeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const htmlBefore = await page.locator('html').getAttribute('class');
      await themeButton.click();
      await page.waitForTimeout(500);
      const htmlAfter = await page.locator('html').getAttribute('class');
      // Class should change (dark ↔ light)
      expect(htmlBefore).not.toBe(htmlAfter);
    }
  });
});

test.describe('SQL dialect switching', () => {
  test('switching between SQLite, PostgreSQL, ClickHouse', async ({ page }) => {
    await page.goto('/');

    // Click PostgreSQL button
    const pgButton = page.getByRole('button', { name: /PostgreSQL/i });
    await expect(pgButton).toBeVisible({ timeout: 10000 });
    await pgButton.click();
    await page.waitForTimeout(300);

    // Click ClickHouse button
    const chButton = page.getByRole('button', { name: /ClickHouse/i });
    await expect(chButton).toBeVisible();
    await chButton.click();
    await page.waitForTimeout(300);

    // Switch back to SQLite
    const sqliteButton = page.getByRole('button', { name: /SQLite/i });
    await expect(sqliteButton).toBeVisible();
    await sqliteButton.click();
  });
});

test.describe('Export functionality', () => {
  test('export dropdown is accessible', async ({ page }) => {
    await page.goto('/');
    // First execute a query to have data to export
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.type('SELECT 1 AS value');
    await page.keyboard.press('Control+Enter');
    await expect(page.getByText('1')).toBeVisible({ timeout: 10000 });

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exportButton.click();
      // CSV or JSON option should appear
      await expect(page.getByText(/CSV|JSON/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
