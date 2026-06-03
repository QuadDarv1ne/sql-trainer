import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env vars before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env vars after each test
    process.env = { ...originalEnv };
  });

  it('should validate required AUTH_SECRET', async () => {
    const { validateEnv } = await import('@/lib/env');

    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required environment variable: AUTH_SECRET');
  });

  it('should validate AUTH_SECRET length', async () => {
    const { validateEnv } = await import('@/lib/env');

    process.env.AUTH_SECRET = 'short';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('AUTH_SECRET: AUTH_SECRET must be at least 32 characters long');
  });

  it('should validate NEXTAUTH_URL format', async () => {
    const { validateEnv } = await import('@/lib/env');

    process.env.AUTH_SECRET = 'a'.repeat(32);
    process.env.NEXTAUTH_URL = 'not-a-url';

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('NEXTAUTH_URL: NEXTAUTH_URL must be a valid URL');
  });

  it('should validate SMTP_PORT range', async () => {
    const { validateEnv } = await import('@/lib/env');

    process.env.AUTH_SECRET = 'a'.repeat(32);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.SMTP_PORT = '99999';

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('SMTP_PORT: SMTP_PORT must be a valid port number (1-65535)');
  });

  it('should pass validation with valid required vars', async () => {
    const { validateEnv } = await import('@/lib/env');

    process.env.AUTH_SECRET = 'a'.repeat(32);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass validation with all vars configured', async () => {
    const { validateEnv } = await import('@/lib/env');

    process.env.AUTH_SECRET = 'a'.repeat(32);
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'password';
    process.env.VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('getRequiredEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return value for existing env var', async () => {
    const { getRequiredEnv } = await import('@/lib/env');

    process.env.AUTH_SECRET = 'test-secret';
    expect(getRequiredEnv('AUTH_SECRET')).toBe('test-secret');
  });

  it('should throw for missing env var', async () => {
    const { getRequiredEnv } = await import('@/lib/env');

    delete process.env.AUTH_SECRET;
    expect(() => getRequiredEnv('AUTH_SECRET')).toThrow('Missing required environment variable: AUTH_SECRET');
  });
});
