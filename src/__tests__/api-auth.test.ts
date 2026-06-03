/**
 * Tests for api-auth.ts helper functions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDateParams, intParam, positiveIntParam } from '../lib/api-auth';

// Mock the auth-internal module
const mockAuth = vi.fn();
vi.mock('@/lib/auth-internal', () => ({
  get auth() {
    return mockAuth;
  },
}));

// Mock rate-limit
const mockRateLimit = vi.fn().mockReturnValue({ success: true });
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  t: (key: string) => key,
}));

// Mock rbac
vi.mock('@/lib/rbac', () => ({
  hasRole: (userRole: string, requiredRole: string) => userRole === requiredRole,
}));

describe('parseDateParams', () => {
  it('returns null for missing params', () => {
    const params = new URLSearchParams();
    expect(parseDateParams(params)).toEqual({ startDate: null, endDate: null });
  });

  it('parses valid date range', () => {
    const params = new URLSearchParams({
      startDate: '1700000000000',
      endDate: '1700086400000',
    });
    const result = parseDateParams(params);
    expect(result.startDate).toBe(1700000000000);
    expect(result.endDate).toBe(1700086400000);
  });

  it('returns null for NaN values', () => {
    const params = new URLSearchParams({ startDate: 'abc', endDate: '1700000000000' });
    expect(parseDateParams(params)).toEqual({ startDate: null, endDate: null, error: 'Invalid startDate parameter' });
  });

  it('returns null for negative timestamps', () => {
    const params = new URLSearchParams({ startDate: '-1000', endDate: '1700000000000' });
    expect(parseDateParams(params)).toEqual({ startDate: null, endDate: null, error: 'Invalid startDate parameter' });
  });

  it('returns null for impossibly large timestamps', () => {
    const params = new URLSearchParams({ startDate: '99999999999999', endDate: '99999999999999' });
    expect(parseDateParams(params)).toEqual({ startDate: null, endDate: null, error: 'Invalid startDate parameter' });
  });

  it('returns null when startDate > endDate', () => {
    const params = new URLSearchParams({
      startDate: '1700086400000',
      endDate: '1700000000000',
    });
    expect(parseDateParams(params)).toEqual({
      startDate: null,
      endDate: null,
      error: 'startDate must be before endDate',
    });
  });
});

describe('intParam', () => {
  it('returns null for missing param', () => {
    const params = new URLSearchParams();
    expect(intParam(params, 'page')).toBeNull();
  });

  it('returns null for non-numeric value', () => {
    const params = new URLSearchParams({ page: 'abc' });
    expect(intParam(params, 'page')).toBeNull();
  });

  it('parses valid integer', () => {
    const params = new URLSearchParams({ page: '42' });
    expect(intParam(params, 'page')).toBe(42);
  });

  it('parses negative integer', () => {
    const params = new URLSearchParams({ offset: '-10' });
    expect(intParam(params, 'offset')).toBe(-10);
  });
});

describe('positiveIntParam', () => {
  it('returns null for missing param', () => {
    const params = new URLSearchParams();
    expect(positiveIntParam(params, 'limit')).toBeNull();
  });

  it('returns null for zero', () => {
    const params = new URLSearchParams({ limit: '0' });
    expect(positiveIntParam(params, 'limit')).toBeNull();
  });

  it('returns valid positive integer', () => {
    const params = new URLSearchParams({ limit: '25' });
    expect(positiveIntParam(params, 'limit')).toBe(25);
  });

  it('caps value at max', () => {
    const params = new URLSearchParams({ limit: '200' });
    expect(positiveIntParam(params, 'limit', 100)).toBe(100);
  });

  it('returns value when under max', () => {
    const params = new URLSearchParams({ limit: '50' });
    expect(positiveIntParam(params, 'limit', 100)).toBe(50);
  });
});

describe('withRoleAuth factory (via withAdminAuth / withTeacherAuth / withUserAuth)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
    mockRateLimit.mockReset().mockReturnValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('withAdminAuth returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const { withAdminAuth } = await import('../lib/api-auth');
    const handler = withAdminAuth(() => new Response('OK') as never);
    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    expect(response.status).toBe(401);
  });

  it('withAdminAuth returns 403 when user is not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'student' } });
    const { withAdminAuth } = await import('../lib/api-auth');
    const handler = withAdminAuth(() => new Response('OK') as never);
    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    expect(response.status).toBe(403);
  });

  it('withAdminAuth calls handler when user is admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    const { withAdminAuth } = await import('../lib/api-auth');
    const handlerFn = vi.fn(() => new Response('OK') as never);
    const handler = withAdminAuth(handlerFn);
    const request = new Request('http://localhost/api/test');
    await handler(request);
    expect(handlerFn).toHaveBeenCalledTimes(1);
  });

  it('withUserAuth returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const { withUserAuth } = await import('../lib/api-auth');
    const handler = withUserAuth(() => new Response('OK') as never);
    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    expect(response.status).toBe(401);
  });

  it('withUserAuth calls handler for any authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'student' } });
    const { withUserAuth } = await import('../lib/api-auth');
    const handlerFn = vi.fn(() => new Response('OK') as never);
    const handler = withUserAuth(handlerFn);
    const request = new Request('http://localhost/api/test');
    await handler(request);
    expect(handlerFn).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    mockRateLimit.mockReturnValue({ success: false });
    const { withAdminAuth } = await import('../lib/api-auth');
    const handler = withAdminAuth(() => new Response('OK') as never);
    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    expect(response.status).toBe(429);
  });

  it('returns 500 when handler throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    const { withAdminAuth } = await import('../lib/api-auth');
    const handler = withAdminAuth(() => {
      throw new Error('Boom');
    });
    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    expect(response.status).toBe(500);
  });

  it('resolves promise-based params (Next.js 15+)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    const { withAdminAuth } = await import('../lib/api-auth');
    const handlerFn = vi.fn(() => new Response('OK') as never);
    const handler = withAdminAuth(handlerFn);
    const request = new Request('http://localhost/api/test');
    await handler(request, { params: Promise.resolve({ id: '123' }) });
    expect(handlerFn).toHaveBeenCalledWith(expect.objectContaining({ params: { id: '123' } }));
  });

  it('handles sync params', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    const { withAdminAuth } = await import('../lib/api-auth');
    const handlerFn = vi.fn(() => new Response('OK') as never);
    const handler = withAdminAuth(handlerFn);
    const request = new Request('http://localhost/api/test');
    await handler(request, { params: { id: '456' } });
    expect(handlerFn).toHaveBeenCalledWith(expect.objectContaining({ params: { id: '456' } }));
  });
});
