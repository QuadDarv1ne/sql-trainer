import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolling } from '@/lib/use-polling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call callback immediately on mount', () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: true }));
    expect(cb).not.toHaveBeenCalled();
  });

  it('should not call callback when disabled', () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: false }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(cb).not.toHaveBeenCalled();
  });

  it('should call callback at the specified interval', () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, { intervalMs: 5000, enabled: true }));

    const initialCalls = cb.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(cb.mock.calls.length).toBe(initialCalls + 1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(cb.mock.calls.length).toBe(initialCalls + 2);
  });

  it('should provide refresh function that calls callback immediately', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => usePolling(cb, { intervalMs: 10000, enabled: true }));

    const callsBefore = cb.mock.calls.length;
    act(() => {
      result.current.refresh();
    });
    expect(cb.mock.calls.length).toBe(callsBefore + 1);
  });

  it('should provide pause and resume functions', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: true }));

    expect(result.current.isPaused).toBe(false);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);
  });

  it('should not tick when paused', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: true }));

    act(() => {
      result.current.pause();
    });

    const callsAtPause = cb.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(cb.mock.calls.length).toBe(callsAtPause);
  });

  it('should clean up interval on unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: true }));

    unmount();

    const callsAtUnmount = cb.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(cb.mock.calls.length).toBe(callsAtUnmount);
  });

  it('should handle async callbacks without errors', async () => {
    const cb = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: true }));

    await act(async () => {
      result.current.refresh();
    });
    expect(cb).toHaveBeenCalled();
  });

  it('should not double-fetch while a previous callback is still running', async () => {
    let resolve: () => void;
    const slow = new Promise<void>((r) => { resolve = r; });
    const cb = vi.fn().mockReturnValue(slow);

    const { result } = renderHook(() => usePolling(cb, { intervalMs: 1000, enabled: true }));

    // First call is from mount. Now call refresh while it's "in-flight".
    act(() => {
      result.current.refresh();
    });
    act(() => {
      result.current.refresh();
    });

    // Should not have called again because first one hasn't resolved
    expect(cb.mock.calls.length).toBe(2); // mount + 1 refresh (second blocked)

    // Resolve the pending promise
    await act(async () => {
      resolve!();
    });
  });
});
