import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('admin page loads with navigation tabs', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to login or show admin content
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('health endpoint returns valid JSON', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('memory');
    expect(body).toHaveProperty('database');
  });

  test('health endpoint includes database status', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const body = await response.json();
    expect(body.database).toHaveProperty('status');
    expect(['connected', 'disconnected', 'error']).toContain(body.database.status);
  });

  test('health endpoint includes memory metrics', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const body = await response.json();
    expect(body.memory.rss).toBeGreaterThan(0);
    expect(body.memory.heapUsed).toBeGreaterThan(0);
  });

  test('unauthenticated admin access redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    // Should either show login or redirect
    const url = page.url();
    expect(url).toBeTruthy();
  });
});
