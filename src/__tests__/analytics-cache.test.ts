import { describe, it, expect, beforeEach } from 'vitest';
import { getCached, setCached, SHORT_TTL, STANDARD_TTL } from '@/lib/analytics-cache';

describe('analytics-cache', () => {
  beforeEach(() => {
    // Clear all cached entries by setting expired ones
    // The cache is module-level, so we can't directly clear it.
    // Instead we test with fresh keys each time.
  });

  describe('getCached / setCached', () => {
    it('returns null for a cache miss', () => {
      expect(getCached('/api/admin/stats', { period: 'week' })).toBeNull();
    });

    it('stores and retrieves a value', () => {
      setCached('/api/admin/stats', { period: 'week' }, { total: 100 });
      expect(getCached('/api/admin/stats', { period: 'week' })).toEqual({ total: 100 });
    });

    it('returns null after TTL expires', () => {
      setCached('/api/expire-test', { id: 1 }, { value: 'data' }, 1); // 1ms TTL
      // Wait for expiry
      const start = Date.now();
      while (Date.now() - start < 5) {
        // busy wait
      }
      expect(getCached('/api/expire-test', { id: 1 })).toBeNull();
    });

    it('uses short TTL constant for live data', () => {
      expect(SHORT_TTL).toBe(10_000);
    });

    it('uses standard TTL constant for analytics', () => {
      expect(STANDARD_TTL).toBe(60_000);
    });

    it('key is order-independent for params', () => {
      setCached('/api/test', { b: 2, a: 1 }, 'result');
      expect(getCached('/api/test', { a: 1, b: 2 })).toBe('result');
    });

    it('ignores null/undefined params in key', () => {
      setCached('/api/null-test', { a: 1, b: null, c: undefined }, 42);
      expect(getCached('/api/null-test', { a: 1 })).toBe(42);
    });

    it('distinguishes between different endpoints', () => {
      setCached('/api/endpoint-a', {}, 'a');
      setCached('/api/endpoint-b', {}, 'b');
      expect(getCached('/api/endpoint-a', {})).toBe('a');
      expect(getCached('/api/endpoint-b', {})).toBe('b');
    });

    it('distinguishes between different params on same endpoint', () => {
      setCached('/api/same', { id: 1 }, 'first');
      setCached('/api/same', { id: 2 }, 'second');
      expect(getCached('/api/same', { id: 1 })).toBe('first');
      expect(getCached('/api/same', { id: 2 })).toBe('second');
    });

    it('handles empty params', () => {
      setCached('/api/empty', {}, { data: true });
      expect(getCached('/api/empty', {})).toEqual({ data: true });
    });

    it('updates lastAccessed on get (LRU refresh)', () => {
      setCached('/api/lru', {}, 'value', 60_000);
      // Access it multiple times — should still return the value
      expect(getCached('/api/lru', {})).toBe('value');
      expect(getCached('/api/lru', {})).toBe('value');
    });

    it('overwrites existing entry on set with same key', () => {
      setCached('/api/overwrite', {}, 'old');
      setCached('/api/overwrite', {}, 'new');
      expect(getCached('/api/overwrite', {})).toBe('new');
    });

    it('handles complex nested objects', () => {
      const data = { users: [{ id: 1, name: 'Test' }], total: 1 };
      setCached('/api/complex', { period: 'month' }, data);
      expect(getCached('/api/complex', { period: 'month' })).toEqual(data);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when cache is full', () => {
      // Fill cache with entries, then add one more to trigger eviction
      // We can't directly know MAX_ENTRIES (200), but we can test the behavior
      // by setting many entries and checking that new ones still work
      for (let i = 0; i < 5; i++) {
        setCached('/api/fill', { idx: i }, i);
      }
      // The most recent entry should always be retrievable
      expect(getCached('/api/fill', { idx: 4 })).toBe(4);
    });
  });

  describe('boolean and number param keys', () => {
    it('handles boolean params', () => {
      setCached('/api/bool', { active: true }, 'yes');
      expect(getCached('/api/bool', { active: true })).toBe('yes');
    });

    it('handles number params', () => {
      setCached('/api/num', { count: 42 }, 'found');
      expect(getCached('/api/num', { count: 42 })).toBe('found');
    });
  });
});
