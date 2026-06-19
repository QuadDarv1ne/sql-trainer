/**
 * Universal data fetching hook for analytics components.
 *
 * Consolidates two previously competing hook implementations into one canonical version.
 * Replaces duplicated useState + useEffect + fetch patterns across 72+ components.
 *
 * Features:
 * - AbortController for race condition prevention on rapid date changes
 * - Automatic date range injection via useDateRange() context
 * - Optional transform function for complex response shaping
 * - Enabled flag for conditional fetching
 * - Manual refetch support
 * - Type-safe: data starts as null (no unsafe casts)
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDateRange } from '@/components/admin/analytics-dashboard';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';

interface UseAnalyticsQueryOptions<T> {
  /** API endpoint path (e.g. '/api/admin/analytics/activity') */
  endpoint: string;

  /** Key to extract from response JSON (e.g. 'activity', 'students'). Ignored if transform is provided. */
  dataKey?: string;

  /** Additional query params beyond date range */
  params?: Record<string, string | number | boolean>;

  /** Optional transform function to extract/shape data from the full response */
  transform?: (json: Record<string, unknown>) => T;

  /** Whether to auto-fetch on mount/date change (default: true) */
  enabled?: boolean;
}

interface UseAnalyticsQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Manually trigger a refetch */
  refetch: () => void;
}

export function useAnalyticsQuery<T = unknown>({
  endpoint,
  dataKey,
  params = {},
  transform,
  enabled = true,
}: UseAnalyticsQueryOptions<T>): UseAnalyticsQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  const { startDate, endDate } = useDateRange();
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(() => {
    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const searchParams = new URLSearchParams();
    if (startDate) searchParams.set('startDate', String(startDate));
    if (endDate) searchParams.set('endDate', String(endDate));
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }

    const url = `${endpoint}?${searchParams}`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: Record<string, unknown>) => {
        if (!controller.signal.aborted) {
          const extracted = transformRef.current ? transformRef.current(json) : (json[dataKey ?? ''] as T);
          setData(extracted);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          logger.error('Analytics fetch failed', err);
          setError(t('analytics.error'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetchCounter triggers manual refetch
  }, [endpoint, dataKey, startDate, endDate, paramsKey, refetchCounter]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData, enabled]);

  const refetch = () => setRefetchCounter((c) => c + 1);

  return { data, loading, error, refetch };
}
