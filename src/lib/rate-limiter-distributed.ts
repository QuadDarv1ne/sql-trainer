/**
 * Distributed rate limiter using Redis.
 * Suitable for multi-server production deployments.
 * Falls back to in-memory store if Redis is unavailable.
 */

import { logger } from './logger';

export interface RateLimitOptions {
  max: number;
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  retryAfter?: number;
}

export interface RateLimiter {
  check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  getStatus(key: string): Promise<RateLimitResult | null>;
}

type RedisClient = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  get(key: string): Promise<string | null>;
  multi(): {
    incr(key: string): unknown;
    expire(key: string, seconds: number): unknown;
    exec(): Promise<[error: unknown, result: unknown][]>;
  };
};

let redisModuleFailed = false;

async function createRedisClient(redisUrl?: string): Promise<RedisClient> {
  if (redisModuleFailed) {
    throw new Error('ioredis is not available');
  }
  try {
    const moduleName = 'ioredis';
    const ioredis: Record<string, unknown> = await import(/* @vite-ignore */ moduleName);
    const Redis = (ioredis.default || ioredis) as new (url: string) => RedisClient;
    return new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  } catch {
    redisModuleFailed = true;
    throw new Error('ioredis is not available');
  }
}

export class RedisRateLimiter implements RateLimiter {
  private redis: RedisClient | null = null;
  private isConnected = false;
  private initPromise: Promise<void> | null = null;

  constructor(redisUrl?: string) {
    this.initPromise = this.initRedis(redisUrl);
  }

  private async initRedis(redisUrl?: string): Promise<void> {
    try {
      const client = await createRedisClient(redisUrl);
      await client.connect();
      this.redis = client;
      this.isConnected = true;
      logger.info('Redis rate limiter connected');
    } catch (error) {
      this.isConnected = false;
      logger.warn('Redis connection failed, falling back to in-memory rate limiter', error);
    }
  }

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    await this.initPromise;
    if (this.isConnected && this.redis) {
      try {
        return await this.checkWithRedis(key, options);
      } catch (error) {
        logger.error('Redis rate limit check failed, falling back to memory', error);
        this.isConnected = false;
      }
    }
    return checkInMemory(key, options);
  }

  private async checkWithRedis(key: string, { max, windowMs = 60_000 }: RateLimitOptions): Promise<RateLimitResult> {
    if (!this.redis) {
      return checkInMemory(key, { max, windowMs });
    }

    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
    const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;

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
    await this.initPromise;
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
    clearInMemoryKey(key);
  }

  async getStatus(key: string): Promise<RateLimitResult | null> {
    await this.initPromise;
    if (this.isConnected && this.redis) {
      try {
        const pattern = `ratelimit:${key}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          const redis = this.redis;
          const counts = await Promise.all(keys.map((k: string) => redis.get(k)));
          const totalCount = counts.reduce((sum, val) => sum + (parseInt(val || '0') || 0), 0);
          return {
            success: totalCount < 100,
            remaining: Math.max(0, 100 - totalCount),
            resetAt: Date.now() + 60_000,
            limit: 100,
          };
        }
      } catch (error) {
        logger.error('Redis rate limit status check failed', error);
      }
    }
    return null;
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