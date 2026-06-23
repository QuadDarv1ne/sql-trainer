import { test, expect } from '@playwright/test';

test.describe('Teacher API - groups', () => {
  test('GET /api/teacher/groups requires auth', async ({ page }) => {
    const resp = await page.request.get('/api/teacher/groups');
    expect(resp.status()).toBe(401);
    const body = await resp.json();
    expect(body.error).toBeDefined();
  });

  test('GET /api/teacher/groups returns rate limit headers', async ({ page }) => {
    const resp = await page.request.get('/api/teacher/groups');
    const headers = resp.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(headers['x-ratelimit-reset']).toBeDefined();
  });

  test('POST /api/teacher/groups without CSRF returns 403', async ({ page }) => {
    const resp = await page.request.post('/api/teacher/groups', {
      data: { name: 'Test Group' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(403);
  });
});

test.describe('Teacher API - engagement', () => {
  test('GET /api/teacher/engagement requires auth', async ({ page }) => {
    const resp = await page.request.get('/api/teacher/engagement');
    expect(resp.status()).toBe(401);
  });

  test('GET /api/teacher/engagement with limit param', async ({ page }) => {
    const resp = await page.request.get('/api/teacher/engagement?limit=10');
    expect([401, 200]).toContain(resp.status());
  });
});

test.describe('Teacher API - churn prediction', () => {
  test('GET /api/teacher/churn-prediction requires auth', async ({ page }) => {
    const resp = await page.request.get('/api/teacher/churn-prediction');
    expect(resp.status()).toBe(401);
  });

  test('GET /api/teacher/churn-prediction with limit param', async ({ page }) => {
    const resp = await page.request.get('/api/teacher/churn-prediction?limit=5');
    expect([401, 200]).toContain(resp.status());
  });
});
