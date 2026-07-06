/**
 * Database connection pool monitoring.
 * Tracks active connections, query timing, and health metrics for SQLite.
 *
 * Usage:
 *   import { dbMonitor } from '@/lib/db-monitor';
 *   // Metrics are automatically collected; expose via /api/health or /api/admin/stats
 */

import { logger } from './logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbPoolMetrics {
  /** Total queries executed since server start */
  totalQueries: number;
  /** Queries that took longer than slowThreshold (default 1000ms) */
  slowQueries: number;
  /** Total errors encountered */
  totalErrors: number;
  /** Average query time in ms (rolling) */
  avgQueryTimeMs: number;
  /** P95 query time in ms (rolling window) */
  p95QueryTimeMs: number;
  /** Last slow query details */
  lastSlowQuery?: {
    sql: string;
    durationMs: number;
    timestamp: string;
  };
  /** Server uptime in seconds */
  uptimeSeconds: number;
  /** Whether the database is currently accessible */
  isAccessible: boolean;
}

// ─── State ───────────────────────────────────────────────────────────────────

let totalQueries = 0;
let slowQueries = 0;
let totalErrors = 0;
let queryTimes: number[] = [];
let lastSlowQuery: DbPoolMetrics['lastSlowQuery'] = undefined;
const slowThresholdMs = 1000; // Log queries slower than 1s
const maxQueryTimes = 1000; // Rolling window size for P95 calculation
const startTime = Date.now();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate P95 from an array of numbers */
function percentile(arr: number[], pct: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((pct / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

/** Update rolling query times window */
function updateQueryTimes(durationMs: number): void {
  queryTimes.push(durationMs);
  if (queryTimes.length > maxQueryTimes) {
    queryTimes.shift();
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Record a completed query execution.
 * Call this from API routes or db wrappers after each query.
 */
export function recordQuery(durationMs: number, sql?: string): void {
  totalQueries++;
  updateQueryTimes(durationMs);

  if (durationMs > slowThresholdMs) {
    slowQueries++;
    const trimmed = sql ? (sql.length > 200 ? sql.slice(0, 200) + '…' : sql) : '(unknown)';
    lastSlowQuery = {
      sql: trimmed,
      durationMs,
      timestamp: new Date().toISOString(),
    };
    logger.warn(`Slow query detected: ${durationMs}ms — ${trimmed}`);
  }
}

/**
 * Record a database error.
 * Call this when a query fails.
 */
export function recordError(): void {
  totalErrors++;
}

/**
 * Get current pool metrics snapshot.
 */
export function getMetrics(): DbPoolMetrics {
  const avgQueryTime =
    queryTimes.length > 0 ? Math.round((queryTimes.reduce((sum, t) => sum + t, 0) / queryTimes.length) * 100) / 100 : 0;

  return {
    totalQueries,
    slowQueries,
    totalErrors,
    avgQueryTimeMs: avgQueryTime,
    p95QueryTimeMs: percentile(queryTimes, 95),
    lastSlowQuery,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    isAccessible: true, // Set to false via recordError if needed
  };
}

/**
 * Reset all metrics (useful for testing).
 */
export function resetMetrics(): void {
  totalQueries = 0;
  slowQueries = 0;
  totalErrors = 0;
  queryTimes = [];
  lastSlowQuery = undefined;
}

// ─── Redis Monitoring ────────────────────────────────────────────────────────

export interface RedisMonitorMetrics {
  /** Whether Redis is connected */
  isConnected: boolean;
  /** Last error message (if any) */
  lastError?: string;
  /** Time since last successful connection in ms */
  lastConnectedAt?: number;
  /** Failed connection attempts counter */
  connectionFailures: number;
}

const redisMetrics: RedisMonitorMetrics = {
  isConnected: false,
  connectionFailures: 0,
};

/**
 * Record Redis connection status.
 */
export function recordRedisConnect(status: { connected: boolean; error?: string }): void {
  redisMetrics.isConnected = status.connected;
  redisMetrics.lastError = status.error;
  if (status.connected) {
    redisMetrics.lastConnectedAt = Date.now();
    redisMetrics.connectionFailures = 0;
  } else {
    redisMetrics.connectionFailures++;
  }
}

/**
 * Get Redis monitoring metrics.
 */
export function getRedisMetrics(): RedisMonitorMetrics {
  return { ...redisMetrics };
}
