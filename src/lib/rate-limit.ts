/**
 * Rate limiter — auto-detects Redis for distributed mode.
 * Uses Redis-based sliding window when REDIS_URL is configured,
 * falls back to in-memory for single-server deployments.
 */

import { getRateLimiter, type RateLimitOptions, type RateLimitResult } from './rate-limiter-distributed';

export type { RateLimitOptions, RateLimitResult };

// In-memory store (kept for direct use in tests and as ultimate fallback)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10_000;

export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}

declare global {
  var __sqlTrainerCleanupInterval: ReturnType<typeof setInterval> | undefined;
}

const cleanupInterval = globalThis.__sqlTrainerCleanupInterval || setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
globalThis.__sqlTrainerCleanupInterval = cleanupInterval;
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

/**
 * Synchronous in-memory rate limit (for tests and direct usage).
 */
export function rateLimitInMemory(key: string, options: RateLimitOptions): RateLimitResult {
  const { max, windowMs = 60_000 } = options;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    if (!entry && store.size >= MAX_ENTRIES) {
      let oldestKey: string | null = null;
      let oldestResetAt = Infinity;
      for (const [k, v] of store) {
        if (v.resetAt < oldestResetAt) {
          oldestResetAt = v.resetAt;
          oldestKey = k;
        }
      }
      if (oldestKey) store.delete(oldestKey);
    }

    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: max - 1, resetAt, limit: max };
  }

  entry.count += 1;

  if (entry.count > max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt, limit: max };
  }

  return { success: true, remaining: max - entry.count, resetAt: entry.resetAt, limit: max };
}

/**
 * Distributed rate limit — auto-uses Redis when REDIS_URL is set.
 * Call with `await` in API route handlers.
 */
export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const limiter = getRateLimiter();
  return limiter.check(key, options);
}

export function clearRateLimitStore(): void {
  store.clear();
}
