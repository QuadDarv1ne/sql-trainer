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
  getDBStats: vi.fn(() => ({ totalUsers: 0, totalProgress: 0 })),
  getStudentProgressById: vi.fn(() => null),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getDb } from '@/lib/db/connection';

function mockDb(prepareResults: Record<string, unknown[]>) {
  const prepareFn = vi.fn((sql: string) => {
    for (const [pattern, result] of Object.entries(prepareResults)) {
      if (sql.includes(pattern)) {
        return {
          all: vi.fn(() => result),
          get: vi.fn(() => result[0] ?? null),
          run: vi.fn(),
        };
      }
    }
    return { all: vi.fn(() => []), get: vi.fn(() => null), run: vi.fn() };
  });

  vi.mocked(getDb).mockReturnValue({
    prepare: prepareFn,
    exec: vi.fn(),
    pragma: vi.fn(() => []),
    transaction: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  } as any);

  return prepareFn;
}

describe('db/analytics — getActiveUsersCount', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return count of active users', async () => {
    mockDb({ 'COUNT(DISTINCT': [{ count: 5 }] });

    const { getActiveUsersCount } = await import('@/lib/db/analytics');
    const result = getActiveUsersCount(7);

    expect(typeof result).toBe('number');
  });
});

describe('db/analytics — getAvgAttemptsPerTask', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return a number', async () => {
    mockDb({ 'ROUND(AVG(attempts': [{ avg: 2.5 }] });

    const { getAvgAttemptsPerTask } = await import('@/lib/db/analytics');
    const result = getAvgAttemptsPerTask();

    expect(typeof result).toBe('number');
    expect(result).toBe(2.5);
  });
});

describe('db/analytics — getErrorPatternAnalysis', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return error pattern entries', async () => {
    mockDb({
      'error_pattern': [{ pattern: 'syntax error', count: 15, affected_tasks: 3 }],
    });

    const { getErrorPatternAnalysis } = await import('@/lib/db/analytics');
    const result = getErrorPatternAnalysis();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db/analytics — getHintUsageByTask', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return hint usage stats for a task', async () => {
    mockDb({
      'hint_usage': [{ count: 10, unique_users: 5 }],
    });

    const { getHintUsageByTask } = await import('@/lib/db/analytics');
    const result = getHintUsageByTask('beginner-1');

    expect(result.count).toBe(10);
    expect(result.unique_users).toBe(5);
  });
});

describe('db/analytics — getHintUsageByStudent', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return hint usage list for a student', async () => {
    mockDb({
      'hint_usage': [
        { task_id: 'beginner-1', revealed_at: Date.now() },
        { task_id: 'beginner-2', revealed_at: Date.now() },
      ],
    });

    const { getHintUsageByStudent } = await import('@/lib/db/analytics');
    const result = getHintUsageByStudent('u1');

    expect(result.length).toBe(2);
    expect(result[0].task_id).toBe('beginner-1');
  });
});

describe('db/analytics — saveHintUsage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should insert hint usage record', async () => {
    const prepareFn = mockDb({});

    const { saveHintUsage } = await import('@/lib/db/analytics');
    saveHintUsage('u1', 'beginner-1');

    expect(prepareFn).toHaveBeenCalled();
  });
});

describe('db/analytics — getWeeklyProgress', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return weekly progress entries', async () => {
    mockDb({
      'strftime': [
        { week: '2026-01', completions: 5, new_users: 2 },
        { week: '2026-02', completions: 8, new_users: 3 },
      ],
    });

    const { getWeeklyProgress } = await import('@/lib/db/analytics');
    const result = getWeeklyProgress(4);

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db/analytics — getStudentPerformanceCards', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return performance cards', async () => {
    mockDb({
      'u.id, u.name': [
        { user_id: 'u1', name: 'Alice', tasks_completed: 10, avg_attempts: 1.5, streak: 5 },
      ],
    });

    const { getStudentPerformanceCards } = await import('@/lib/db/analytics');
    const result = getStudentPerformanceCards(10);

    expect(Array.isArray(result)).toBe(true);
  });
});
