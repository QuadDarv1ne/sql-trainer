/**
 * Distributed rate limiter using Redis.
 * Suitable for multi-server production deployments.
 * Falls back to in-memory store if Redis is unavailable.
 */

import { logger } from './logger';

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
  retryAfter?: number; // Seconds until retry is allowed
}

export interface RateLimiter {
  check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  getStatus(key: string, options?: RateLimitOptions): Promise<RateLimitResult | null>;
  isHealthy(): boolean;
}

/**
 * Redis-based rate limiter using sliding window counter.
 * Implements the algorithm described in:
 * https://cloud.google.com/architecture/rate-limiting-strategies-techniques
 */
export class RedisRateLimiter implements RateLimiter {
  private redis: ReturnType<typeof createRedisClient> | null = null;
  private isConnected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(redisUrl?: string) {
    this.initRedis(redisUrl);
  }

  private async initRedis(redisUrl?: string): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      try {
        const redisClient = createRedisClient(redisUrl);
        if (!redisClient) {
          this.isConnected = false;
          return;
        }
        await redisClient.connect();
        this.redis = redisClient;
        this.isConnected = true;
        logger.info('Redis rate limiter connected');
      } catch (error) {
        this.isConnected = false;
        logger.warn('Redis connection failed, falling back to in-memory rate limiter', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return this.connectPromise;
  }

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    // Try Redis first if available
    if (this.isConnected && this.redis) {
      try {
        return await this.checkWithRedis(key, options);
      } catch (error) {
        logger.error('Redis rate limit check failed, falling back to memory', error);
        this.isConnected = false;
      }
    }

    // Fall back to in-memory
    return checkInMemory(key, options);
  }

  private async checkWithRedis(key: string, { max, windowMs = 60_000 }: RateLimitOptions): Promise<RateLimitResult> {
    if (!this.redis) {
      return checkInMemory(key, { max, windowMs });
    }

    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
    const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;

    // Use Redis MULTI/EXEC for atomic operations
    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, Math.ceil(windowMs / 1000));
    const results = await multi.exec();

    const currentCount = (results?.[0] as [error: unknown, result: number])?.[1] ?? 1;
    const remaining = Math.max(0, max - currentCount);
    const success = currentCount <= max;

    return {
      success,
      remaining,
      resetAt,
      limit: max,
      retryAfter: success ? undefined : Math.ceil((resetAt - now) / 1000),
    };
  }

  async reset(key: string): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        const pattern = `ratelimit:${key}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        logger.error('Redis rate limit reset failed', error);
      }
    }
    // Also clear from in-memory as fallback
    clearInMemoryKey(key);
  }

  async getStatus(key: string, options?: RateLimitOptions): Promise<RateLimitResult | null> {
    const max = options?.max ?? 100;
    const windowMs = options?.windowMs ?? 60_000;
    if (this.isConnected && this.redis) {
      try {
        const now = Date.now();
        const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
        const val = await this.redis.get(windowKey);
        const totalCount = parseInt(val || '0') || 0;
        const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
        return {
          success: totalCount < max,
          remaining: Math.max(0, max - totalCount),
          resetAt,
          limit: max,
        };
      } catch (error) {
        logger.error('Redis rate limit status check failed', error);
      }
    }
    return null;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.disconnect();
        this.isConnected = false;
        this.redis = null;
        logger.info('Redis rate limiter disconnected');
      } catch (error) {
        logger.error('Redis disconnect error', error);
      }
    }
  }
}

// In-memory fallback implementation
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(key: string, { max, windowMs = 60_000 }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      remaining: max - 1,
      resetAt: now + windowMs,
      limit: max,
    };
  }

  entry.count += 1;
  const success = entry.count <= max;

  return {
    success,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
    limit: max,
    retryAfter: success ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  };
}

function clearInMemoryKey(key: string): void {
  memoryStore.delete(key);
}

// Singleton instance
let globalRateLimiter: RedisRateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RedisRateLimiter(process.env.REDIS_URL);
  }
  return globalRateLimiter;
}

export function resetGlobalRateLimiter(): void {
  globalRateLimiter = null;
  memoryStore.clear();
}

// Helper function to create Redis client (lazy-loaded, optional dependency)
// The module name is constructed dynamically to prevent bundlers from
// trying to resolve it at build time when ioredis is not installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRedisClient(redisUrl?: string): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require(/* turbopackIgnore: true */ 'io' + 'redis');
    return new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  } catch {
    logger.warn('ioredis is not installed — distributed rate limiting will use in-memory fallback');
    return null;
  }
}
