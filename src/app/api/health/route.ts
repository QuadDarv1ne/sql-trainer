import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-users';
import { getRateLimiter } from '@/lib/rate-limiter-distributed';
import { logger } from '@/lib/logger';
import { withTiming } from '@/lib/api-timing';
import { getMetrics as getDbMetrics, getRedisMetrics } from '@/lib/db-monitor';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  version?: string;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    pressurePercent: number;
  };
  process: {
    pid: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    queryTimeMs: number;
    tableCount: number;
    metrics: {
      totalQueries: number;
      slowQueries: number;
      totalErrors: number;
      avgQueryTimeMs: number;
      p95QueryTimeMs: number;
      uptimeSeconds: number;
    };
  };
  redis: 'connected' | 'disconnected' | 'not_configured';
  redisMetrics: {
    isConnected: boolean;
    connectionFailures: number;
    lastError?: string;
  };
}

export const GET = withTiming(async () => {
  const status: HealthStatus = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      pressurePercent: 0,
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    database: {
      status: 'disconnected',
      queryTimeMs: 0,
      tableCount: 0,
      metrics: {
        totalQueries: 0,
        slowQueries: 0,
        totalErrors: 0,
        avgQueryTimeMs: 0,
        p95QueryTimeMs: 0,
        uptimeSeconds: 0,
      },
    },
    redis: 'disconnected',
    redisMetrics: {
      isConnected: false,
      connectionFailures: 0,
    },
  };

  // Memory
  const mem = process.memoryUsage();
  status.memory = {
    rss: mem.rss,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
    pressurePercent: mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0,
  };

  // Database with timing
  try {
    const db = getDb();
    const dbStart = performance.now();
    const result = db.prepare('SELECT 1 AS health_check').get() as { health_check: number } | undefined;
    status.database.queryTimeMs = Math.round(performance.now() - dbStart);

    if (result && result.health_check === 1) {
      status.database.status = 'connected';
      try {
        const tables = db
          .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
          .get() as { count: number } | undefined;
        status.database.tableCount = tables?.count ?? 0;
      } catch {
        // table count is optional
      }
    } else {
      status.database.status = 'error';
      status.status = 'degraded';
    }
  } catch (error) {
    logger.error('Health check: database connection failed', error);
    status.database.status = 'error';
    status.status = 'degraded';
  }

  // Redis
  try {
    const limiter = getRateLimiter();
    status.redis = limiter.isHealthy() ? 'connected' : 'disconnected';
  } catch {
    status.redis = 'not_configured';
  }

  // DB pool metrics
  const dbMetrics = getDbMetrics();
  const redisMetrics = getRedisMetrics();
  status.database.metrics = {
    totalQueries: dbMetrics.totalQueries,
    slowQueries: dbMetrics.slowQueries,
    totalErrors: dbMetrics.totalErrors,
    avgQueryTimeMs: dbMetrics.avgQueryTimeMs,
    p95QueryTimeMs: dbMetrics.p95QueryTimeMs,
    uptimeSeconds: dbMetrics.uptimeSeconds,
  };
  status.redisMetrics = {
    isConnected: redisMetrics.isConnected,
    connectionFailures: redisMetrics.connectionFailures,
    lastError: redisMetrics.lastError,
  };

  status.version = process.env.NEXT_PUBLIC_APP_VERSION || undefined;

  if (status.database.status === 'connected' && status.redis !== 'disconnected') {
    status.status = 'healthy';
  } else if (status.database.status === 'error' || status.redis === 'disconnected') {
    status.status = 'degraded';
  }

  return NextResponse.json(status, {
    status: status.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': status.status === 'healthy' ? 'public, max-age=30' : 'no-store',
      ...(status.status !== 'healthy' ? { 'Retry-After': '30' } : {}),
    },
  });
}, 'api/health');
