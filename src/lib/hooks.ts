'use client';

import { useState, useEffect, useRef } from 'react';
import { t } from '@/lib/i18n';

interface UseAnalyticsQueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseAnalyticsQueryOptions {
  /**
   * Base endpoint path (e.g., '/api/admin/analytics/activity').
   * Date range params are appended automatically when provided.
   */
  endpoint: string;

  /**
   * Key name in the response JSON that holds the data.
   * For `{ activity: [...] }` use `'activity'`.
   */
  dataKey: string;

  /**
   * Optional start timestamp for date range filtering.
   */
  startDate?: number | null;

  /**
   * Optional end timestamp for date range filtering.
   */
  endDate?: number | null;

  /**
   * Dependencies that trigger a refetch (besides dates).
   */
  dependencies?: unknown[];
}

/**
 * Custom hook for fetching analytics data with proper cleanup.
 *
 * Eliminates duplicated boilerplate across 60+ analytics components:
 * - AbortController for race condition prevention
 * - Loading / error / data state management
 * - Date range param handling
 * - I18n error messages
 *
 * Example:
 *   const { data, loading, error } = useAnalyticsQuery({
 *     endpoint: '/api/admin/analytics/activity',
 *     dataKey: 'activity',
 *     startDate,
 *     endDate,
 *   });
 */
export function useAnalyticsQuery<T = unknown>({
  endpoint,
  dataKey,
  startDate,
  endDate,
  dependencies = [],
}: UseAnalyticsQueryOptions): UseAnalyticsQueryResult<T> {
  const [data, setData] = useState<T>([] as unknown as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    const url = `${endpoint}?${params}`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!controller.signal.aborted) {
          setData(json[dataKey]);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(t('analytics.error'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetchCounter enables manual refetch
  }, [endpoint, dataKey, startDate, endDate, refetchCounter, ...dependencies]);

  const refetch = () => setRefetchCounter((c) => c + 1);

  return { data, loading, error, refetch };
}
