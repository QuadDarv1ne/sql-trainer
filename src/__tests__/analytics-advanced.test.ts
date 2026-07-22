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

describe('db/analytics — getSessionAnalysis', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return session analysis', async () => {
    mockDb({
      'session': [
        { user_id: 'u1', name: 'Alice', session_count: 10, avg_tasks_per_session: 3.5 },
      ],
    });

    const { getSessionAnalysis } = await import('@/lib/db/analytics');
    const result = getSessionAnalysis();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db/analytics — getHintImpactAnalysis', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return hint impact analysis', async () => {
    mockDb({
      'hint_usage': [
        { task_id: 'beginner-1', hint_users: 5, no_hint_users: 10, hint_avg_attempts: 2.5, no_hint_avg_attempts: 1.8 },
      ],
    });

    const { getHintImpactAnalysis } = await import('@/lib/db/analytics');
    const result = getHintImpactAnalysis();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db/analytics — getDeadlineCompliance', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return deadline compliance', async () => {
    mockDb({
      'deadline_id': [
        { deadline_id: 'd1', title: 'Quiz 1', total_students: 20, completed_before_deadline: 15, completed_after_deadline: 3, not_completed: 2 },
      ],
    });

    const { getDeadlineCompliance } = await import('@/lib/db/analytics');
    const result = getDeadlineCompliance();

    expect(result).toHaveProperty('deadlines');
    expect(result).toHaveProperty('overall_stats');
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
