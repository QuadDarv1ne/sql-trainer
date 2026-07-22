import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCorrelationId, apiError, apiServerError } from '@/lib/api-error';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('api-error', () => {
  describe('generateCorrelationId', () => {
    it('should return an 8-character string', () => {
      const id = generateCorrelationId();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(8);
    });

    it('should return unique IDs on successive calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(50);
    });

    it('should only contain hex characters', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  describe('apiError', () => {
    it('should return a NextResponse with the given status', () => {
      const res = apiError('Not found', 404);
      expect(res.status).toBe(404);
    });

    it('should include success: false in the body', async () => {
      const res = apiError('Bad request', 400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Bad request');
    });

    it('should include a correlation ID', async () => {
      const res = apiError('Error', 500);
      const body = await res.json();
      expect(typeof body.correlationId).toBe('string');
      expect(body.correlationId.length).toBe(8);
    });

    it('should use provided correlation ID', async () => {
      const res = apiError('Error', 500, 'custom-id');
      const body = await res.json();
      expect(body.correlationId).toBe('custom-id');
    });

    it('should include error details when error is an Error instance', async () => {
      const err = new Error('database connection failed');
      const res = apiError('Internal error', 500, undefined, err);
      const body = await res.json();
      expect(body.details).toBe('database connection failed');
    });

    it('should not include details when error is not an Error', async () => {
      const res = apiError('Internal error', 500, undefined, 'string error');
      const body = await res.json();
      expect(body.details).toBeUndefined();
    });
  });

  describe('apiServerError', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should always return status 500', () => {
      const res = apiServerError('Database query');
      expect(res.status).toBe(500);
    });

    it('should return generic error message in production', async () => {
      const res = apiServerError('Database query');
      const body = await res.json();
      expect(body.error).toBe('Internal server error');
    });

    it('should not leak details in production', async () => {
      const err = new Error('密码错误');
      const res = apiServerError('Auth failed', undefined, err);
      const body = await res.json();
      expect(body.details).toBeUndefined();
    });

    it('should include correlation ID', async () => {
      const res = apiServerError('Service down', 'trace-123');
      const body = await res.json();
      expect(body.correlationId).toBe('trace-123');
    });

    it('should generate correlation ID if not provided', async () => {
      const res = apiServerError('Service down');
      const body = await res.json();
      expect(typeof body.correlationId).toBe('string');
      expect(body.correlationId.length).toBe(8);
    });
  });
});
