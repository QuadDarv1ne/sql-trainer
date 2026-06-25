import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-users';
import { getRateLimiter } from '@/lib/rate-limiter-distributed';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number; // seconds
  memory: {
    rss: number; // bytes
    heapUsed: number; // bytes
    heapTotal: number; // bytes
  };
  database: 'connected' | 'disconnected' | 'error';
  redis: 'connected' | 'disconnected' | 'not_configured';
  version?: string;
}

export async function GET() {
  const status: HealthStatus = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
    database: 'disconnected',
    redis: 'disconnected',
  };

  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 AS health_check').get() as { health_check: number } | undefined;
    if (result && result.health_check === 1) {
      status.database = 'connected';
    } else {
      status.database = 'error';
      status.status = 'degraded';
    }
  } catch (error) {
    logger.error('Health check: database connection failed', error);
    status.database = 'error';
    status.status = 'degraded';
  }

  try {
    const limiter = getRateLimiter();
    status.redis = limiter.isHealthy() ? 'connected' : 'disconnected';
    if (status.redis === 'disconnected') {
      status.status = 'degraded';
    }
  } catch {
    status.redis = 'not_configured';
  }

  status.version = process.env.NEXT_PUBLIC_APP_VERSION || undefined;

  if (status.database === 'connected' && status.redis !== 'disconnected') {
    status.status = 'healthy';
  } else if (status.database === 'error' || status.redis === 'disconnected') {
    status.status = 'degraded';
  }

  return NextResponse.json(status, {
    status: status.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': status.status === 'healthy' ? 'public, max-age=30' : 'no-store',
      ...(status.status !== 'healthy' ? { 'Retry-After': '30' } : {}),
    },
  });
}
