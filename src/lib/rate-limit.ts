/**
 * Lightweight in-memory rate limiter for API routes.
 * Uses a sliding window counter per key (e.g., IP address, user ID).
 * Not suitable for multi-server deployments — use Redis for production.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Window duration in milliseconds (default: 60 seconds) */
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (IP, user ID, etc.)
 * @param options - Rate limit configuration
 * @returns Result indicating whether the request is allowed
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { max, windowMs = 60_000 } = options;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start fresh
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
 * Clear all rate limit entries (useful for tests).
 */
export function clearRateLimitStore(): void {
  store.clear();
}

/**
 * Clean up expired entries (call periodically in production).
 */
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
