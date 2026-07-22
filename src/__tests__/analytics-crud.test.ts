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

describe('db/analytics — addGroupMembers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should add members to a group', async () => {
    const { runFn } = mockDb({});

    const { addGroupMembers } = await import('@/lib/db/analytics');
    const result = addGroupMembers('g1', ['u1', 'u2', 'u3']);

    expect(result).toBe(3);
    expect(runFn).toHaveBeenCalled();
  });

  it('should return 0 when no members provided', async () => {
    mockDb({});

    const { addGroupMembers } = await import('@/lib/db/analytics');
    const result = addGroupMembers('g1', []);

    expect(result).toBe(0);
  });
});

describe('db/analytics — updateGroup', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update group name', async () => {
    mockDb({
      'g.id, g.name, g.description': [{
        id: 'g1', name: 'Updated Group', description: 'Desc', teacher_name: 'Prof',
        member_count: 5, created_at: Date.now(), updated_at: Date.now(),
      }],
    });

    const { updateGroup } = await import('@/lib/db/analytics');
    const result = updateGroup('g1', { name: 'Updated Group' });

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated Group');
  });

  it('should return null when group not found', async () => {
    mockDb({});

    const { updateGroup } = await import('@/lib/db/analytics');
    const result = updateGroup('nonexistent', { name: 'Test' });

    expect(result).toBeNull();
  });

  it('should return existing group when no fields to update', async () => {
    mockDb({
      'g.id, g.name, g.description': [{
        id: 'g1', name: 'Original', description: 'Desc', teacher_name: 'Prof',
        member_count: 3, created_at: Date.now(), updated_at: Date.now(),
      }],
    });

    const { updateGroup } = await import('@/lib/db/analytics');
    const result = updateGroup('g1', {});

    expect(result).not.toBeNull();
  });
});

describe('db/analytics — updateDeadline', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update deadline title', async () => {
    mockDb({
      'SELECT * FROM deadlines': [{
        id: 'd1', creator_id: 't1', type: 'exam', title: 'Old Title',
        target_type: 'all_students', due_at: Date.now(),
        created_at: Date.now(), updated_at: Date.now(),
      }],
    });

    const { updateDeadline } = await import('@/lib/db/analytics');
    const result = updateDeadline('d1', { title: 'New Title' }, 't1');

    expect(result).toBe(true);
  });

  it('should return false when deadline not found', async () => {
    mockDb({});

    const { updateDeadline } = await import('@/lib/db/analytics');
    const result = updateDeadline('nonexistent', { title: 'Test' }, 't1');

    expect(result).toBe(false);
  });

  it('should return false when creator is not owner and not admin', async () => {
    mockDb({
      'SELECT * FROM deadlines': [{
        id: 'd1', creator_id: 't1', type: 'exam', title: 'Test',
        target_type: 'all_students', due_at: Date.now(),
        created_at: Date.now(), updated_at: Date.now(),
      }],
      'SELECT role FROM users WHERE id': [{ role: 'teacher' }],
    });

    const { updateDeadline } = await import('@/lib/db/analytics');
    const result = updateDeadline('d1', { title: 'Hacked' }, 't2');

    expect(result).toBe(false);
  });
});

describe('db/analytics — getSystemHealth', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return system health data', async () => {
    mockDb({
      'SELECT 1': [{ 1: 1 }],
      'COUNT(*) as c FROM users': [{ c: 50 }],
      'COUNT(*) as c FROM user_progress': [{ c: 200 }],
      'COUNT(*) as c FROM user_achievements': [{ c: 45 }],
      'COUNT(DISTINCT user_id) as c FROM user_progress WHERE completed_at': [{ c: 10 }],
      'COUNT(*) as c FROM user_progress WHERE completed_at': [{ c: 25 }],
      'strftime': [{ hour: '08', completions: 5, users: 3 }],
    });

    const { getSystemHealth } = await import('@/lib/db/analytics');
    const result = getSystemHealth();

    expect(result).toHaveProperty('total_users');
    expect(result).toHaveProperty('db_connection_status');
  });
});

describe('db/analytics — getDailyActivity', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return daily activity data', async () => {
    mockDb({
      'strftime': [
        { date: '2026-01-15', completions: 5, users: 3 },
        { date: '2026-01-16', completions: 8, users: 5 },
      ],
    });

    const { getDailyActivity } = await import('@/lib/db/analytics');
    const result = getDailyActivity(7);

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db/analytics — getAdminLeaderboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return admin leaderboard', async () => {
    mockDb({
      'u.id, u.name': [
        { user_id: 'u1', name: 'Alice', tasks_completed: 15, xp: 150, level: 3 },
        { user_id: 'u2', name: 'Bob', tasks_completed: 10, xp: 100, level: 2 },
      ],
    });

    const { getAdminLeaderboard } = await import('@/lib/db/analytics');
    const result = getAdminLeaderboard(10);

    expect(Array.isArray(result)).toBe(true);
  });
});
