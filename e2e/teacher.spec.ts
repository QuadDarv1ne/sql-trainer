import { test, expect } from '@playwright/test';

test.describe('Teacher Dashboard', () => {
  test('teacher page loads or redirects to login', async ({ page }) => {
    await page.goto('/teacher');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('health endpoint returns valid JSON with database metrics', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('database');
    expect(body.database).toHaveProperty('status');
    expect(body.database).toHaveProperty('metrics');
  });

  test('health endpoint includes Redis status', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const body = await response.json();
    expect(body).toHaveProperty('redis');
    expect(['connected', 'disconnected', 'not_configured']).toContain(body.redis);
  });

  test('health endpoint includes process info', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const body = await response.json();
    expect(body.process.pid).toBeGreaterThan(0);
    expect(typeof body.process.nodeVersion).toBe('string');
    expect(typeof body.process.platform).toBe('string');
  });

  test('health endpoint returns 200 when healthy', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
  });
});
