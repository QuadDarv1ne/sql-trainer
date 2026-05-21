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

  // Keep callback ref current
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const tick = useCallback(() => {
    if (!isPaused && enabled) {
      callbackRef.current();
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
        // Immediately refresh when tab becomes visible
        callbackRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const refresh = useCallback(() => {
    callbackRef.current();
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    setIsPaused(false);
    callbackRef.current();
  }, []);

  return { refresh, pause, resume, isPaused };
}
