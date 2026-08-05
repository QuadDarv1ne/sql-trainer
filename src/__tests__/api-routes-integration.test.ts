/**
 * Integration tests for core API route handlers.
 * Tests /api/sql/verify, /api/auth/register by invoking route handlers
 * directly with mock NextRequest objects.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const TEST_DB = path.join(process.cwd(), 'data', `test-api-integration-${crypto.randomUUID().slice(0, 8)}.db`);

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/i18n', () => ({
  t: (key: string) => key,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true })),
  getClientIdentifier: vi.fn(() => 'test-client'),
  RATE_LIMIT_WINDOWS: { oneMinute: 60_000, tenMinutes: 600_000, fifteenMinutes: 900_000, oneHour: 3_600_000 },
}));

vi.mock('@/lib/csrf', () => ({
  validateCsrfTokenEdge: () => true,
  csrfErrorResponse: () => new Response(JSON.stringify({ success: false, error: 'CSRF validation failed' }), { status: 403 }),
}));

vi.mock('@/lib/sanitization', () => ({
  sanitizeName: (name: string) => ({ value: name }),
  sanitizePhone: (phone: string) => ({ value: phone }),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

beforeAll(async () => {
  process.env.DATABASE_PATH = TEST_DB;
  const { initDatabase } = await import('@/lib/db/schema');
  initDatabase();
});

afterAll(async () => {
  delete process.env.DATABASE_PATH;
  try {
    const { getDb } = await import('@/lib/db/connection');
    getDb().close();
  } catch {
    // db already closed
  }
  try {
    fs.unlinkSync(TEST_DB);
    fs.unlinkSync(TEST_DB + '-wal');
    fs.unlinkSync(TEST_DB + '-shm');
  } catch {
    // file already deleted
  }
});

function makePostRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(
    new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/sql/verify', () => {
  it('rejects empty body with 400', { timeout: 15000 }, async () => {
    const { POST } = await import('@/app/api/sql/verify/route');
    const req = makePostRequest('http://localhost/api/sql/verify', {});
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects invalid taskId with 404', async () => {
    const { POST } = await import('@/app/api/sql/verify/route');
    const req = makePostRequest('http://localhost/api/sql/verify', {
      sql: 'SELECT 1',
      taskId: 'nonexistent',
      dbType: 'sqlite',
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.verified).toBe(false);
  });

  it('rejects missing sql field', async () => {
    const { POST } = await import('@/app/api/sql/verify/route');
    const req = makePostRequest('http://localhost/api/sql/verify', {
      taskId: 'beginner-1',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  it('rejects invalid email with 400', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const req = makePostRequest('http://localhost/api/auth/register', {
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects short password with 400', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const req = makePostRequest('http://localhost/api/auth/register', {
      name: 'Test',
      email: 'test@example.com',
      password: '123',
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects missing name', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const req = makePostRequest('http://localhost/api/auth/register', {
      email: 'test@example.com',
      password: 'password123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
