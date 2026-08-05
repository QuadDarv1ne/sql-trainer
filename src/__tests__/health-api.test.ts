import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db-users', () => ({
  getDb: vi.fn(() => ({
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({ health_check: 1 })),
    })),
  })),
}));

vi.mock('@/lib/rate-limiter-distributed', () => ({
  getRateLimiter: vi.fn(() => ({
    isHealthy: vi.fn(() => true),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/api-timing', () => ({
  withTiming: vi.fn((handler: (...args: unknown[]) => unknown) => handler),
}));

vi.mock('@/lib/db-monitor', () => ({
  getMetrics: vi.fn(() => ({
    totalQueries: 100,
    slowQueries: 2,
    totalErrors: 1,
    avgQueryTimeMs: 5.5,
    p95QueryTimeMs: 20,
    uptimeSeconds: 3600,
  })),
  getRedisMetrics: vi.fn(() => ({
    isConnected: false,
    connectionFailures: 0,
    lastError: undefined,
  })),
}));

describe('api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a valid health status object', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET(new Request('http://localhost/api/health'));
    const body = await response.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('memory');
    expect(body).toHaveProperty('process');
    expect(body).toHaveProperty('database');
    expect(body).toHaveProperty('redis');
    expect(body).toHaveProperty('eventLoop');
  });

  it('should include memory metrics', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET(new Request('http://localhost/api/health'));
    const body = await response.json();

    expect(body.memory.rss).toBeGreaterThan(0);
    expect(body.memory.heapUsed).toBeGreaterThan(0);
    expect(body.memory.heapTotal).toBeGreaterThan(0);
    expect(typeof body.memory.pressurePercent).toBe('number');
  });

  it('should include process info', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET(new Request('http://localhost/api/health'));
    const body = await response.json();

    expect(body.process.pid).toBeGreaterThan(0);
    expect(typeof body.process.nodeVersion).toBe('string');
    expect(typeof body.process.platform).toBe('string');
  });

  it('should include database metrics', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET(new Request('http://localhost/api/health'));
    const body = await response.json();

    expect(body.database.status).toBe('connected');
    expect(body.database.metrics.totalQueries).toBe(100);
    expect(body.database.metrics.slowQueries).toBe(2);
  });

  it('should return 200 when healthy', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET(new Request('http://localhost/api/health'));

    expect(response.status).toBe(200);
  });

  it('should return 503 when database is down', async () => {
    const { getDb } = await import('@/lib/db-users');
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const { GET } = await import('@/app/api/health/route');
    const response = await GET(new Request('http://localhost/api/health'));

    expect(response.status).toBe(503);
  });
});
