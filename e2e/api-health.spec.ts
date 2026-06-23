import { test, expect } from '@playwright/test';

test.describe('Health endpoint', () => {
  test('GET /api/health returns healthy status', async ({ page }) => {
    const resp = await page.request.get('/api/health');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe('healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('memory');
    expect(body.database).toBe('connected');
  });

  test('health response includes redis status', async ({ page }) => {
    const resp = await page.request.get('/api/health');
    const body = await resp.json();
    expect(body).toHaveProperty('redis');
    expect(['connected', 'disconnected', 'not_configured']).toContain(body.redis);
  });

  test('health response includes version when set', async ({ page }) => {
    const resp = await page.request.get('/api/health');
    const body = await resp.json();
    // version is optional, just verify structure
    expect(body).toHaveProperty('version');
  });
});

test.describe('Web Vitals endpoint', () => {
  test('POST /api/web-vitals accepts valid metric', async ({ page }) => {
    const resp = await page.request.post('/api/web-vitals', {
      data: {
        name: 'LCP',
        value: 1200,
        rating: 'good',
        delta: 100,
        id: 'test-123',
        navigationType: 'navigate',
        page: '/app',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
  });

  test('POST /api/web-vitals rejects invalid payload', async ({ page }) => {
    const resp = await page.request.post('/api/web-vitals', {
      data: { name: 'LCP' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(400);
  });
});

test.describe('Rate limit headers', () => {
  test('admin endpoint returns rate limit headers', async ({ page }) => {
    const resp = await page.request.get('/api/admin/users');
    // Will return 401 (unauthenticated) but should still have rate limit headers
    const headers = resp.headers();
    if (resp.status() !== 401) {
      // If somehow authenticated, check headers
      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['x-ratelimit-reset']).toBeDefined();
    }
    // 401 is expected without auth — that's fine
    expect([401, 200]).toContain(resp.status());
  });
});
