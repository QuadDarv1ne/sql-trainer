/**
 * usePolling - Custom React hook for auto-refresh with configurable interval
 * Features:
 * - Configurable polling interval
 * - Pauses when tab is hidden (visibilitychange API)
 * - Manual refresh trigger
 * - Pause/resume controls
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface UsePollingOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
) {
  const { intervalMs = 30000, enabled = true } = options;
  const callbackRef = useRef(callback);
  const [isPaused, setIsPaused] = useState(false);
  const isFetchingRef = useRef(false);

  // Keep callback ref current
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const tick = useCallback(() => {
    if (!isPaused && enabled && !isFetchingRef.current) {
      isFetchingRef.current = true;
      const result = callbackRef.current();
      if (result instanceof Promise) {
        result.finally(() => { isFetchingRef.current = false; });
      } else {
        isFetchingRef.current = false;
      }
    }
  }, [isPaused, enabled]);

  // Set up interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [tick, intervalMs, enabled]);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        // Immediately refresh when tab becomes visible (if not already fetching)
        if (!isFetchingRef.current) {
          callbackRef.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const refresh = useCallback(() => {
    if (!isFetchingRef.current) {
      callbackRef.current();
    }
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    setIsPaused(false);
    if (!isFetchingRef.current) {
      callbackRef.current();
    }
  }, []);

  return { refresh, pause, resume, isPaused };
}
