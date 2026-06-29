import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordQuery,
  recordError,
  getMetrics,
  resetMetrics,
  recordRedisConnect,
  getRedisMetrics,
} from '@/lib/db-monitor';

describe('db-monitor', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('recordQuery', () => {
    it('should record query execution time', () => {
      recordQuery(50, 'SELECT 1');
      const metrics = getMetrics();
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.avgQueryTimeMs).toBe(50);
      expect(metrics.p95QueryTimeMs).toBe(50);
    });

    it('should track slow queries', () => {
      recordQuery(1500, 'SELECT * FROM users');
      const metrics = getMetrics();
      expect(metrics.slowQueries).toBe(1);
      expect(metrics.lastSlowQuery).toBeDefined();
      expect(metrics.lastSlowQuery!.durationMs).toBe(1500);
    });

    it('should not track fast queries as slow', () => {
      recordQuery(500, 'SELECT 1');
      const metrics = getMetrics();
      expect(metrics.slowQueries).toBe(0);
      expect(metrics.lastSlowQuery).toBeUndefined();
    });

    it('should truncate long SQL in lastSlowQuery', () => {
      const longSql = 'SELECT ' + 'a'.repeat(300);
      recordQuery(2000, longSql);
      const metrics = getMetrics();
      expect(metrics.lastSlowQuery!.sql.length).toBeLessThanOrEqual(203); // 200 + '…'
    });

    it('should calculate rolling average correctly', () => {
      recordQuery(100, 'SELECT 1');
      recordQuery(200, 'SELECT 2');
      recordQuery(300, 'SELECT 3');
      const metrics = getMetrics();
      expect(metrics.avgQueryTimeMs).toBe(200);
    });

    it('should track multiple queries', () => {
      recordQuery(100, 'SELECT 1');
      recordQuery(200, 'SELECT 2');
      const metrics = getMetrics();
      expect(metrics.totalQueries).toBe(2);
    });
  });

  describe('recordError', () => {
    it('should increment error counter', () => {
      recordError();
      const metrics = getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });

    it('should track multiple errors', () => {
      recordError();
      recordError();
      recordError();
      const metrics = getMetrics();
      expect(metrics.totalErrors).toBe(3);
    });
  });

  describe('getMetrics', () => {
    it('should return all metric fields', () => {
      const metrics = getMetrics();
      expect(metrics).toMatchObject({
        totalQueries: 0,
        slowQueries: 0,
        totalErrors: 0,
        avgQueryTimeMs: 0,
        p95QueryTimeMs: 0,
        uptimeSeconds: expect.any(Number),
        isAccessible: true,
      });
    });

    it('should include uptime', () => {
      const metrics = getMetrics();
      expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all counters', () => {
      recordQuery(100, 'SELECT 1');
      recordError();
      resetMetrics();
      const metrics = getMetrics();
      expect(metrics.totalQueries).toBe(0);
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.slowQueries).toBe(0);
      expect(metrics.lastSlowQuery).toBeUndefined();
    });
  });

  describe('P95 calculation', () => {
    it('should calculate P95 correctly for small dataset', () => {
      for (let i = 1; i <= 10; i++) {
        recordQuery(i * 10, `SELECT ${i}`);
      }
      const metrics = getMetrics();
      // P95 of [10,20,...,100] should be around 95
      expect(metrics.p95QueryTimeMs).toBeGreaterThanOrEqual(90);
      expect(metrics.p95QueryTimeMs).toBeLessThanOrEqual(100);
    });
  });
});

describe('redis-monitor', () => {
  describe('recordRedisConnect', () => {
    it('should track connection status', () => {
      recordRedisConnect({ connected: true });
      const metrics = getRedisMetrics();
      expect(metrics.isConnected).toBe(true);
      expect(metrics.connectionFailures).toBe(0);
    });

    it('should track connection failures', () => {
      recordRedisConnect({ connected: false, error: 'ECONNREFUSED' });
      recordRedisConnect({ connected: false });
      recordRedisConnect({ connected: true });
      const metrics = getRedisMetrics();
      expect(metrics.isConnected).toBe(true);
    });

    it('should store last error message', () => {
      recordRedisConnect({ connected: false, error: 'timeout' });
      const metrics = getRedisMetrics();
      expect(metrics.lastError).toBe('timeout');
    });
  });

  describe('getRedisMetrics', () => {
    it('should return current redis state', () => {
      const metrics = getRedisMetrics();
      expect(metrics).toHaveProperty('isConnected');
      expect(metrics).toHaveProperty('connectionFailures');
    });
  });
});
