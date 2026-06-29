import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SystemHealth from '@/components/admin/system-health';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock ResizeObserver and IntersectionObserver for recharts
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
vi.stubGlobal(
  'IntersectionObserver',
  class {
    constructor() {
      return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const mockHealthResponse = {
  health: {
    db_size_bytes: 1048576,
    db_wal_size_bytes: 524288,
    total_users: 42,
    total_progress_entries: 150,
    total_achievements: 10,
    active_today: 15,
    active_this_week: 30,
    completions_today: 25,
    completions_this_week: 80,
    db_connection_status: 'healthy' as const,
    last_24h_activity: [],
  },
};

describe('SystemHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    render(<SystemHealth />);

    expect(screen.getByText(/Loading analytics/i)).toBeTruthy();
  });

  it('displays system health data after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthResponse),
    });

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeTruthy();
    });

    // Verify key metrics are displayed
    expect(screen.getByText('150')).toBeTruthy(); // progress_entries
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load system health data/i)).toBeTruthy();
    });
  });
});
