import { test, expect } from '@playwright/test';

test.describe('Security headers (proxy)', () => {
  test('CSP headers are present on API responses', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('HSTS header is present', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
  });

  test('X-Frame-Options is DENY', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Options is nosniff', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('Referrer-Policy is strict-origin-when-cross-origin', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('X-XSS-Protection is enabled', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['x-xss-protection']).toBe('1; mode=block');
  });

  test('Permissions-Policy blocks camera/microphone/geolocation', async ({ page }) => {
    const resp = await page.goto('/');
    const headers = resp!.headers();
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');
    expect(headers['permissions-policy']).toContain('geolocation=()');
  });
});

test.describe('CSRF protection (proxy)', () => {
  test('POST without CSRF token returns 403', async ({ page, context }) => {
    const resp = await page.request.post('/api/sql', {
      data: { sql: 'SELECT 1' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(403);
    const body = await resp.json();
    expect(body.error).toContain('CSRF');
  });
});
