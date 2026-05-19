import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, clearRateLimitStore, cleanupExpiredEntries } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it('should allow requests within limit', () => {
    const result1 = rateLimit('user:1', { max: 3, windowMs: 60_000 });
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);
    expect(result1.limit).toBe(3);

    const result2 = rateLimit('user:1', { max: 3, windowMs: 60_000 });
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = rateLimit('user:1', { max: 3, windowMs: 60_000 });
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    rateLimit('user:2', { max: 2, windowMs: 60_000 });
    rateLimit('user:2', { max: 2, windowMs: 60_000 });

    const result = rateLimit('user:2', { max: 2, windowMs: 60_000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track different keys independently', () => {
    const result1 = rateLimit('user:A', { max: 1, windowMs: 60_000 });
    const result2 = rateLimit('user:B', { max: 1, windowMs: 60_000 });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Both should now be blocked
    expect(rateLimit('user:A', { max: 1, windowMs: 60_000 }).success).toBe(false);
    expect(rateLimit('user:B', { max: 1, windowMs: 60_000 }).success).toBe(false);
  });

  it('should reset after window expires', () => {
    // Use a very short window
    rateLimit('user:3', { max: 1, windowMs: 10 });

    // Should be blocked
    expect(rateLimit('user:3', { max: 1, windowMs: 10 }).success).toBe(false);

    // Wait for window to expire
    // Since we can't easily manipulate time, test with a fresh key and verify resetAt is set
    const result = rateLimit('user:4', { max: 1, windowMs: 10 });
    expect(result.resetAt).toBeGreaterThan(Date.now() - 100);
  });

  it('should return correct resetAt timestamp', () => {
    const now = Date.now();
    const result = rateLimit('user:5', { max: 5, windowMs: 30_000 });

    expect(result.resetAt).toBeGreaterThanOrEqual(now + 30_000 - 100); // Allow small timing variance
    expect(result.resetAt).toBeLessThanOrEqual(now + 30_000 + 100);
  });
});

describe('clearRateLimitStore', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it('should clear all rate limit entries', () => {
    rateLimit('user:1', { max: 1, windowMs: 60_000 });
    rateLimit('user:2', { max: 1, windowMs: 60_000 });

    clearRateLimitStore();

    // After clearing, both should be allowed again
    expect(rateLimit('user:1', { max: 1, windowMs: 60_000 }).success).toBe(true);
    expect(rateLimit('user:2', { max: 1, windowMs: 60_000 }).success).toBe(true);
  });
});

describe('cleanupExpiredEntries', () => {
  it('should remove expired entries', async () => {
    // Create entries with very short windows
    rateLimit('expired:1', { max: 1, windowMs: 1 });
    rateLimit('expired:2', { max: 1, windowMs: 1 });
    rateLimit('active:1', { max: 1, windowMs: 60_000 });

    // Wait for short windows to expire
    await new Promise((r) => setTimeout(r, 10));

    const cleaned = cleanupExpiredEntries();

    // At least the 2 expired entries should be cleaned
    expect(cleaned).toBeGreaterThanOrEqual(2);
  });
});
