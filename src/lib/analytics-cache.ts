/**
 * In-memory LRU cache for analytics API responses.
 * Reduces redundant SQLite queries when multiple components fetch the same data.
 */

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

/** Default TTL: 60 seconds for heavy queries */
const DEFAULT_TTL_MS = 60_000;
/** Short TTL: 10 seconds for frequently-changing data (live activity) */
const SHORT_TTL_MS = 10_000;
/** Max number of entries in the cache */
const MAX_ENTRIES = 200;

const cache = new Map<string, CacheEntry>();

export type CacheParams = Record<string, string | number | boolean | null | undefined>;

function buildKey(endpoint: string, params: CacheParams): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${endpoint}?${new URLSearchParams(sorted as [string, string][]).toString()}`;
}

export function getCached<T>(
  endpoint: string,
  params: CacheParams = {},
): T | null {
  const key = buildKey(endpoint, params);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  entry.lastAccessed = Date.now();
  return entry.value as T;
}

export function setCached<T>(
  endpoint: string,
  params: CacheParams,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  const key = buildKey(endpoint, params);

  // Evict LRU entry if cache is full
  if (cache.size >= MAX_ENTRIES) {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [k, v] of cache) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, { value: data, expiresAt: Date.now() + ttlMs, lastAccessed: Date.now() });
}

/** Short TTL for live/frequently-changing data */
export const SHORT_TTL = SHORT_TTL_MS;
/** Standard TTL for analytics queries */
export const STANDARD_TTL = DEFAULT_TTL_MS;
