import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/connection', () => ({
  getDb: vi.fn(),
  DB_PATH: ':memory:',
}));

vi.mock('@/lib/db/users', () => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/db-users', () => ({
  getDb: vi.fn(),
  getDBStats: vi.fn(() => ({
    totalUsers: 50, totalProgress: 200, totalAchievements: 45,
    activeToday: 10, activeThisWeek: 30, completionsToday: 25,
    completionsThisWeek: 80, dbSizeBytes: 1048576, dbWalSizeBytes: 524288,
  })),
  getStudentProgressById: vi.fn(() => null),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getDb } from '@/lib/db/connection';

function mockDb(prepareResults: Record<string, unknown[]>) {
  const runFn = vi.fn().mockReturnValue({ changes: 1 });
  const prepareFn = vi.fn((sql: string) => {
    for (const [pattern, result] of Object.entries(prepareResults)) {
      if (sql.includes(pattern)) {
        return {
          all: vi.fn(() => result),
          get: vi.fn(() => result[0] ?? null),
          run: runFn,
        };
      }
    }
    return { all: vi.fn(() => []), get: vi.fn(() => null), run: runFn };
  });

  vi.mocked(getDb).mockReturnValue({
    prepare: prepareFn,
    exec: vi.fn(),
    pragma: vi.fn(() => []),
    transaction: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  } as any);

  return { prepareFn, runFn };
}

describe('db/analytics — getOnboardingFunnel', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return onboarding funnel', async () => {
    mockDb({
      'u.id, u.created_at': [
        { id: 'u1', created_at: Date.now() - 86400000, first_completion: Date.now() - 80000000, total_completed: 10 },
        { id: 'u2', created_at: Date.now() - 86400000, first_completion: null, total_completed: 0 },
      ],
    });

    const { getOnboardingFunnel } = await import('@/lib/db/analytics');
    const result = getOnboardingFunnel();

    expect(result).toHaveProperty('funnel');
    expect(result).toHaveProperty('summary');
    expect(result.funnel.length).toBeGreaterThan(0);
  });
});

describe('db/analytics — getWeekdayVsWeekendPerformance', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return weekday vs weekend performance', async () => {
    mockDb({
      "strftime('%w'": [
        { day_type: 'weekday', avg_tasks: 3.5, avg_attempts: 1.8 },
        { day_type: 'weekend', avg_tasks: 2.0, avg_attempts: 2.2 },
      ],
    });

    const { getWeekdayVsWeekendPerformance } = await import('@/lib/db/analytics');
    const result = getWeekdayVsWeekendPerformance();

    expect(result).toHaveProperty('weekday');
    expect(result).toHaveProperty('weekend');
  });
});

describe('db/analytics — getLiveActivity', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return live activity', async () => {
    mockDb({
      'last_active IS NOT NULL AND last_active >=': [
        { id: 'u1', name: 'Alice', email: 'alice@test.com', last_active: Date.now() },
      ],
      'COUNT(*) as count FROM users WHERE last_active IS NOT NULL AND last_active >=': [{ count: 5 }],
    });

    const { getLiveActivity } = await import('@/lib/db/analytics');
    const result = getLiveActivity();

    expect(result).toHaveProperty('active_now');
    expect(result).toHaveProperty('active_last_5min');
    expect(result).toHaveProperty('active_last_hour');
    expect(result).toHaveProperty('active_last_24h');
  });
});

describe('db/analytics — getABTestComparison', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return A/B test comparison', async () => {
    mockDb({
      'COUNT(DISTINCT up.user_id) as count': [
        { count: 25, avg_attempts: 1.8, completion_rate: 45, avg_time_hours: 0.033 },
      ],
    });

    const { getABTestComparison } = await import('@/lib/db/analytics');
    const result = getABTestComparison();

    expect(result).toHaveProperty('test_name');
    expect(result).toHaveProperty('group_a');
    expect(result).toHaveProperty('group_b');
    expect(result).toHaveProperty('metrics');
  });
});
