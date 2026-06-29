import { test, expect } from '@playwright/test';

test.describe('SQL Trainer', () => {
  test('page loads with welcome panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/SQL/, { exact: false })).toBeVisible();
  });

  test('SQL execution flow: write query, execute, see results', async ({ page }) => {
    await page.goto('/');
    // CodeMirror editor uses a contenteditable div
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.type('SELECT 1 AS value');

    // Execute via keyboard
    await page.keyboard.press('Control+Enter');

    // Wait for results
    await expect(page.getByText('1')).toBeVisible({ timeout: 10000 });
  });

  test('error handling: wrong SQL shows error message', async ({ page }) => {
    await page.goto('/');
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.type('SELEC * FROM nonexistent');
    await page.keyboard.press('Control+Enter');

    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
  });

  test('task selection and execution', async ({ page }) => {
    await page.goto('/');
    // Click on a task in the sidebar (task buttons contain title text)
    const taskButton = page.getByRole('button', { name: /SELECT|FROM|WHERE/i }).first();
    await taskButton.click();

    // Task panel should be visible with description
    await expect(page.getByRole('heading', { level: 3 })).toBeVisible({ timeout: 10000 });
  });

  test('DB type selector is visible', async ({ page }) => {
    await page.goto('/');
    // DB selector buttons contain SQLite, PostgreSQL, ClickHouse
    const dbSelector = page.getByRole('button', { name: 'SQLite' });
    await expect(dbSelector).toBeVisible();
  });

  test('EXPLAIN query flow', async ({ page }) => {
    await page.goto('/');
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.type('SELECT 1');

    // Click EXPLAIN button
    const explainButton = page.getByRole('button', { name: /explain/i });
    await explainButton.click();

    await expect(page.getByText(/SCAN|SEARCH|EXPLAIN/i)).toBeVisible({ timeout: 10000 });
  });

  test('hint and solution toggle', async ({ page }) => {
    await page.goto('/');
    // Find a task in sidebar and click it
    const taskButton = page.getByRole('button', { name: /SELECT|FROM|WHERE/i }).first();
    await taskButton.click();

    // Wait for task panel to load
    await page.waitForTimeout(500);

    // Check for hint button
    const hintButton = page.getByRole('button', { name: /hint/i });
    if (await hintButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hintButton.click();
      await expect(page.getByText(/hint/i)).toBeVisible();
    }

    // Check for solution button
    const solutionButton = page.getByRole('button', { name: /solution/i });
    if (await solutionButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await solutionButton.click();
      // Solution should appear in editor
      const editorContent = await page.locator('.cm-content').first().textContent();
      expect(editorContent).toBeTruthy();
    }
  });
});
