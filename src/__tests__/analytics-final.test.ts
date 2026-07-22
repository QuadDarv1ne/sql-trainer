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

describe('db/analytics — getAuditLog', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return audit log entries', async () => {
    mockDb({
      'audit_log': [
        { id: 'a1', actor_id: 'u1', action: 'login', target_type: 'user', target_id: 'u1', details: '{}', created_at: Date.now() },
      ],
    });

    const { getAuditLog } = await import('@/lib/db/analytics');
    const result = getAuditLog();

    expect(result).toHaveProperty('entries');
    expect(result).toHaveProperty('summary');
  });
});

describe('db/analytics — getDifficultyCalibration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return difficulty calibration', async () => {
    mockDb({
      'task_id': [
        { task_id: 'beginner-1', completions: 20, avg_attempts: 1.5, first_attempt_rate: 85, failure_rate: 5 },
        { task_id: 'intermediate-1', completions: 10, avg_attempts: 2.5, first_attempt_rate: 65, failure_rate: 15 },
      ],
    });

    const { getDifficultyCalibration } = await import('@/lib/db/analytics');
    const result = getDifficultyCalibration();

    expect(result).toHaveProperty('tasks');
    expect(result).toHaveProperty('total_tasks');
  });
});

describe('db/analytics — getHintUsageAnalytics', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return hint usage analytics', async () => {
    mockDb({
      'hint_usage': [
        { task_id: 'beginner-1', hint_count: 10, unique_users: 5 },
      ],
      "COUNT(*) as count FROM users WHERE role = 'student'": [{ count: 20 }],
    });

    const { getHintUsageAnalytics } = await import('@/lib/db/analytics');
    const result = getHintUsageAnalytics();

    expect(result).toHaveProperty('total_hints_revealed');
    expect(result).toHaveProperty('per_task');
  });
});
