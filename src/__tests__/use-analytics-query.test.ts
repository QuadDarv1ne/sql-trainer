/**
 * Tests for useAnalyticsQuery hook.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnalyticsQuery } from '../hooks/use-analytics-query';

// Mock useDateRange context
const mockDateRange: { startDate: number | null; endDate: number | null } = { startDate: null, endDate: null };
vi.mock('@/components/admin/analytics-dashboard', () => ({
  useDateRange: () => mockDateRange,
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  t: (key: string) => key,
}));

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
  mockDateRange.startDate = null;
  mockDateRange.endDate = null;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function createResponse(ok: boolean, data: unknown, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe('useAnalyticsQuery', () => {
  it('fetches data and returns loading → data', async () => {
    mockFetch.mockResolvedValue(createResponse(true, { items: [1, 2, 3] }));

    const { result } = renderHook(() => useAnalyticsQuery({ endpoint: '/api/test', dataKey: 'items' }));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValue(createResponse(false, {}, 500));

    const { result } = renderHook(() => useAnalyticsQuery({ endpoint: '/api/test' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('analytics.error');
    });
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAnalyticsQuery({ endpoint: '/api/test' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('analytics.error');
    });
  });

  it('uses transform function to shape data', async () => {
    mockFetch.mockResolvedValue(createResponse(true, { summary: { total: 42 }, items: ['a', 'b'] }));

    const { result } = renderHook(() =>
      useAnalyticsQuery({
        endpoint: '/api/test',
        transform: (json) => ({
          total: (json.summary as { total: number }).total,
          count: (json.items as string[]).length,
        }),
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ total: 42, count: 2 });
  });

  it('includes date range params when set', async () => {
    mockDateRange.startDate = 1700000000000;
    mockDateRange.endDate = 1700086400000;
    mockFetch.mockResolvedValue(createResponse(true, {}));

    renderHook(() => useAnalyticsQuery({ endpoint: '/api/test' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const lastCall = mockFetch.mock.lastCall;
    expect(lastCall).toBeDefined();
    const [url] = lastCall as [string];
    expect(url).toContain('startDate=1700000000000');
    expect(url).toContain('endDate=1700086400000');
  });

  it('includes additional params', async () => {
    mockFetch.mockResolvedValue(createResponse(true, {}));

    renderHook(() =>
      useAnalyticsQuery({
        endpoint: '/api/test',
        params: { filter: 'active', limit: 10 },
      }),
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const lastCall = mockFetch.mock.lastCall;
    expect(lastCall).toBeDefined();
    const [url] = lastCall as [string];
    expect(url).toContain('filter=active');
    expect(url).toContain('limit=10');
  });

  it('does not fetch when enabled is false', async () => {
    mockFetch.mockResolvedValue(createResponse(true, {}));

    renderHook(() => useAnalyticsQuery({ endpoint: '/api/test', enabled: false }));

    await waitFor(() => expect(mockFetch).not.toHaveBeenCalled(), { timeout: 100 });
  });

  it('provides refetch function', async () => {
    mockFetch.mockResolvedValue(createResponse(true, { data: 'first' }));

    const { result } = renderHook(() => useAnalyticsQuery({ endpoint: '/api/test' }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetch.mockResolvedValueOnce(createResponse(true, { data: 'second' }));
    result.current.refetch();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('aborts in-flight request on re-fetch (race condition prevention)', async () => {
    const abortSignals: AbortSignal[] = [];

    mockFetch.mockImplementation(async (_url, opts) => {
      const signal = opts?.signal as AbortSignal;
      abortSignals.push(signal);
      if (abortSignals.length === 1) {
        // First fetch: wait until aborted or 500ms
        await new Promise<void>((resolve) => {
          const check = () => {
            if (signal.aborted) {
              resolve();
              return;
            }
            setTimeout(check, 10);
          };
          check();
          // Timeout fallback
          setTimeout(resolve, 500);
        });
      }
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      return createResponse(true, { data: 'ok' });
    });

    const { rerender } = renderHook(
      ({ counter }) =>
        useAnalyticsQuery({
          endpoint: '/api/test',
          params: { counter },
        }),
      { initialProps: { counter: 1 } },
    );

    // Trigger re-render with different params immediately
    rerender({ counter: 2 });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2), { timeout: 600 });
    // The first request should have been aborted
    expect(abortSignals[0]?.aborted).toBe(true);
  });
});
