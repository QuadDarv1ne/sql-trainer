/**
 * Universal data fetching hook for analytics components.
 * Replaces duplicated useState + useEffect + fetch patterns.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDateRange } from '@/components/admin/analytics-dashboard';
import { t } from '@/lib/i18n';

interface UseAnalyticsQueryOptions<T> {
  /** API endpoint path (e.g. '/api/admin/analytics/activity') */
  endpoint: string;
  /** Key to extract from response JSON (e.g. 'activity', 'students') */
  dataKey: string;
  /** Additional query params beyond date range */
  params?: Record<string, string | number | boolean>;
  /** Whether to auto-fetch on mount/date change */
  enabled?: boolean;
}

interface UseAnalyticsQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
}

export function useAnalyticsQuery<T = unknown>({
  endpoint,
  dataKey,
  params = {},
  enabled = true,
}: UseAnalyticsQueryOptions<T>): UseAnalyticsQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startDate, endDate } = useDateRange();
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (startDate) searchParams.set('startDate', String(startDate));
      if (endDate) searchParams.set('endDate', String(endDate));
      for (const [key, value] of Object.entries(params)) {
        searchParams.set(key, String(value));
      }

      const response = await fetch(`${endpoint}?${searchParams}`, {
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? t('analytics.error')
            : response.status === 403
              ? t('analytics.error')
              : `HTTP ${response.status}`
        );
      }

      const json = await response.json();
      setData(json[dataKey] ?? null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(t('analytics.error'));
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, startDate, endDate, JSON.stringify(params)]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData, enabled]);

  return { data, loading, error, refetch: fetchData };
}
