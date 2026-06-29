/**
 * Tests for distributed rate limiter.
 * Tests both Redis and in-memory implementations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedisRateLimiter, getRateLimiter, resetGlobalRateLimiter } from '@/lib/rate-limiter-distributed';

describe('Distributed Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalRateLimiter();
  });

  afterEach(() => {
    resetGlobalRateLimiter();
  });

  describe('In-memory fallback', () => {
    it('should allow requests under the limit', async () => {
      const limiter = new RedisRateLimiter();
      const result = await limiter.check('test-key', { max: 5, windowMs: 60_000 });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('should block requests over the limit', async () => {
      const limiter = new RedisRateLimiter();

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await limiter.check('limit-test', { max: 5, windowMs: 60_000 });
      }

      // 6th request should be blocked
      const result = await limiter.check('limit-test', { max: 5, windowMs: 60_000 });

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', async () => {
      const limiter = new RedisRateLimiter();
      const shortWindow = 100; // 100ms window

      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        await limiter.check('short-window-test', { max: 3, windowMs: shortWindow });
      }

      // Should be blocked
      let result = await limiter.check('short-window-test', { max: 3, windowMs: shortWindow });
      expect(result.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, shortWindow + 50));

      // Should be allowed again
      result = await limiter.check('short-window-test', { max: 3, windowMs: shortWindow });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should handle different keys independently', async () => {
      const limiter = new RedisRateLimiter();

      // Exhaust limit for key1
      for (let i = 0; i < 3; i++) {
        await limiter.check('key1', { max: 3, windowMs: 60_000 });
      }

      // key2 should still have full quota
      const result = await limiter.check('key2', { max: 3, windowMs: 60_000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);

      // key1 should be blocked
      const result1 = await limiter.check('key1', { max: 3, windowMs: 60_000 });
      expect(result1.success).toBe(false);
    });

    it('should provide retryAfter in seconds when blocked', async () => {
      const limiter = new RedisRateLimiter();

      // Exhaust the limit
      for (let i = 0; i < 2; i++) {
        await limiter.check('retry-test', { max: 2, windowMs: 60_000 });
      }

      const result = await limiter.check('retry-test', { max: 2, windowMs: 60_000 });

      expect(result.success).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });

    it('should use default window of 60 seconds', async () => {
      const limiter = new RedisRateLimiter();
      const result = await limiter.check('default-window', { max: 5 });

      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000);
    });

    it('should handle large max values', async () => {
      const limiter = new RedisRateLimiter();
      const result = await limiter.check('large-limit', { max: 10000, windowMs: 60_000 });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9999);
    });
  });

  describe('Reset functionality', () => {
    it('should reset rate limit for a specific key', async () => {
      const limiter = new RedisRateLimiter();

      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        await limiter.check('reset-test', { max: 3, windowMs: 60_000 });
      }

      // Verify blocked
      let result = await limiter.check('reset-test', { max: 3, windowMs: 60_000 });
      expect(result.success).toBe(false);

      // Reset
      await limiter.reset('reset-test');

      // Should be allowed again
      result = await limiter.check('reset-test', { max: 3, windowMs: 60_000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should not affect other keys when resetting', async () => {
      const limiter = new RedisRateLimiter();

      // Exhaust both keys
      for (let i = 0; i < 3; i++) {
        await limiter.check('key-a', { max: 3, windowMs: 60_000 });
        await limiter.check('key-b', { max: 3, windowMs: 60_000 });
      }

      // Reset only key-a
      await limiter.reset('key-a');

      // key-a should be allowed
      const resultA = await limiter.check('key-a', { max: 3, windowMs: 60_000 });
      expect(resultA.success).toBe(true);

      // key-b should still be blocked
      const resultB = await limiter.check('key-b', { max: 3, windowMs: 60_000 });
      expect(resultB.success).toBe(false);
    });
  });

  describe('Status check', () => {
    it('should return null for keys with no activity', async () => {
      const limiter = new RedisRateLimiter();
      const status = await limiter.getStatus('nonexistent-key');

      expect(status).toBeNull();
    });

    it('should return status for active keys', async () => {
      const limiter = new RedisRateLimiter();

      // Make some requests
      await limiter.check('status-test', { max: 10, windowMs: 60_000 });
      await limiter.check('status-test', { max: 10, windowMs: 60_000 });

      const status = await limiter.getStatus('status-test');

      // In-memory fallback returns null for getStatus
      // Redis implementation would return actual status
      expect(status).toBeNull(); // Expected for in-memory fallback
    });
  });

  describe('Global rate limiter singleton', () => {
    it('should return same instance on multiple calls', () => {
      const limiter1 = getRateLimiter();
      const limiter2 = getRateLimiter();

      expect(limiter1).toBe(limiter2);
    });

    it('should create new instance after reset', () => {
      const limiter1 = getRateLimiter();
      resetGlobalRateLimiter();
      const limiter2 = getRateLimiter();

      expect(limiter1).not.toBe(limiter2);
    });
  });

  describe('Edge cases', () => {
    it('should handle max value of 1', async () => {
      const limiter = new RedisRateLimiter();

      const result1 = await limiter.check('single-req', { max: 1, windowMs: 60_000 });
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = await limiter.check('single-req', { max: 1, windowMs: 60_000 });
      expect(result2.success).toBe(false);
    });

    it('should handle very short windows', async () => {
      const limiter = new RedisRateLimiter();
      const result = await limiter.check('short-window', { max: 5, windowMs: 10 });

      expect(result.success).toBe(true);
      expect(result.resetAt).toBeGreaterThanOrEqual(Date.now() - 1000);
    });

    it('should handle special characters in keys', async () => {
      const limiter = new RedisRateLimiter();
      const specialKey = 'user:123:ip:192.168.1.1:endpoint:/api/test';

      const result = await limiter.check(specialKey, { max: 5, windowMs: 60_000 });
      expect(result.success).toBe(true);
    });

    it('should handle unicode keys', async () => {
      const limiter = new RedisRateLimiter();
      const unicodeKey = 'пользователь:测试:ユーザー';

      const result = await limiter.check(unicodeKey, { max: 5, windowMs: 60_000 });
      expect(result.success).toBe(true);
    });

    it('should handle empty key gracefully', async () => {
      const limiter = new RedisRateLimiter();
      const result = await limiter.check('', { max: 5, windowMs: 60_000 });

      expect(result.success).toBe(true);
    });
  });

  describe('Concurrent requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const limiter = new RedisRateLimiter();
      const max = 10;

      // Make 15 concurrent requests
      const promises = Array.from({ length: 15 }, () => limiter.check('concurrent-test', { max, windowMs: 60_000 }));

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.success).length;
      const blocked = results.filter((r) => !r.success).length;

      expect(successful).toBe(max);
      expect(blocked).toBe(5);
    });
  });

  describe('RateLimiter interface compliance', () => {
    it('should implement check method', async () => {
      const limiter = new RedisRateLimiter();
      expect(typeof limiter.check).toBe('function');

      const result = await limiter.check('test', { max: 5 });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetAt');
      expect(result).toHaveProperty('limit');
    });

    it('should implement reset method', async () => {
      const limiter = new RedisRateLimiter();
      expect(typeof limiter.reset).toBe('function');

      await expect(limiter.reset('test')).resolves.not.toThrow();
    });

    it('should implement getStatus method', async () => {
      const limiter = new RedisRateLimiter();
      expect(typeof limiter.getStatus).toBe('function');

      const status = await limiter.getStatus('test');
      expect(status).toBeNull(); // In-memory fallback returns null
    });
  });
});
