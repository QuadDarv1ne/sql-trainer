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

function buildKey(endpoint: string, params: Record<string, string | number | boolean | null>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${endpoint}?${new URLSearchParams(sorted as [string, string][]).toString()}`;
}

export function getCached<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | null> = {},
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
  params: Record<string, string | number | boolean | null>,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  // Evict least recently used entry if at capacity
  if (cache.size >= MAX_ENTRIES) {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, entry] of cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }

  const key = buildKey(endpoint, params);
  cache.set(key, { value, expiresAt: Date.now() + ttlMs, lastAccessed: Date.now() });
}

export function invalidateCache(endpoint?: string): void {
  if (endpoint) {
    for (const key of cache.keys()) {
      if (key.startsWith(endpoint)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/** Short TTL for live/frequently-changing data */
export const SHORT_TTL = SHORT_TTL_MS;
/** Standard TTL for analytics queries */
export const STANDARD_TTL = DEFAULT_TTL_MS;
/** Long TTL for static/slow-changing data */
export const LONG_TTL = 300_000;
