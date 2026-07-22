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
  const runFn = vi.fn();
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

describe('db/analytics — queueEmail', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should insert email into queue and return id', async () => {
    const { runFn } = mockDb({});

    const { queueEmail } = await import('@/lib/db/analytics');
    const result = queueEmail('u1', 'Test Subject', '<p>Body</p>');

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(runFn).toHaveBeenCalled();
  });
});

describe('db/analytics — markEmailSent', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update email status to sent', async () => {
    const { runFn } = mockDb({});

    const { markEmailSent } = await import('@/lib/db/analytics');
    markEmailSent('email-1');

    expect(runFn).toHaveBeenCalled();
  });
});

describe('db/analytics — markEmailFailed', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update email status with error', async () => {
    const { runFn } = mockDb({});

    const { markEmailFailed } = await import('@/lib/db/analytics');
    markEmailFailed('email-1', 'SMTP timeout');

    expect(runFn).toHaveBeenCalled();
  });
});

describe('db/analytics — markScheduleSent', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should mark reminder schedule as sent', async () => {
    const { runFn } = mockDb({});

    const { markScheduleSent } = await import('@/lib/db/analytics');
    markScheduleSent('r1');

    expect(runFn).toHaveBeenCalled();
  });
});

describe('db/analytics — markScheduleFailed', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should mark reminder schedule as failed', async () => {
    const { runFn } = mockDb({});

    const { markScheduleFailed } = await import('@/lib/db/analytics');
    markScheduleFailed('r1', 'Network error');

    expect(runFn).toHaveBeenCalled();
  });
});

describe('db/analytics — savePushSubscription', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should insert push subscription', async () => {
    const { runFn } = mockDb({});

    const { savePushSubscription } = await import('@/lib/db/analytics');
    savePushSubscription('u1', {
      endpoint: 'https://fcm.googleapis.com/test',
      p256dh: 'key123',
      auth: 'auth123',
    });

    expect(runFn).toHaveBeenCalled();
  });
});

describe('db/analytics — deleteGroup', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should delete group and return true', async () => {
    const { runFn } = mockDb({});
    runFn.mockReturnValue({ changes: 1 });

    const { deleteGroup } = await import('@/lib/db/analytics');
    const result = deleteGroup('g1');

    expect(result).toBe(true);
  });

  it('should return false when group not found', async () => {
    const { runFn } = mockDb({});
    runFn.mockReturnValue({ changes: 0 });

    const { deleteGroup } = await import('@/lib/db/analytics');
    const result = deleteGroup('nonexistent');

    expect(result).toBe(false);
  });
});

describe('db/analytics — removeGroupMember', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should remove member and return true', async () => {
    const { runFn } = mockDb({});
    runFn.mockReturnValue({ changes: 1 });

    const { removeGroupMember } = await import('@/lib/db/analytics');
    const result = removeGroupMember('g1', 'u1');

    expect(result).toBe(true);
  });

  it('should return false when member not found', async () => {
    const { runFn } = mockDb({});
    runFn.mockReturnValue({ changes: 0 });

    const { removeGroupMember } = await import('@/lib/db/analytics');
    const result = removeGroupMember('g1', 'nonexistent');

    expect(result).toBe(false);
  });
});

describe('db/analytics — deleteDeadline', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should delete deadline and return true', async () => {
    mockDb({
      'SELECT * FROM deadlines': [{
        id: 'd1', creator_id: 't1', type: 'exam', title: 'Test',
        target_type: 'all_students', due_at: Date.now(),
        created_at: Date.now(), updated_at: Date.now(),
      }],
    });

    const { deleteDeadline } = await import('@/lib/db/analytics');
    const result = deleteDeadline('d1', 't1');

    expect(result).toBe(true);
  });

  it('should return false when deadline not found', async () => {
    mockDb({});

    const { deleteDeadline } = await import('@/lib/db/analytics');
    const result = deleteDeadline('nonexistent', 't1');

    expect(result).toBe(false);
  });
});

describe('db/analytics — getErrorTrendAnalysis', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return error trend data', async () => {
    mockDb({
      'error_trend': [
        { date: '2026-01-15', errors: 5, unique_users: 3 },
        { date: '2026-01-16', errors: 2, unique_users: 1 },
      ],
    });

    const { getErrorTrendAnalysis } = await import('@/lib/db/analytics');
    const result = getErrorTrendAnalysis(30);

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db/analytics — getStreakAnalytics', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return streak analytics', async () => {
    mockDb({
      'streak_current, u.streak_longest': [
        { id: 'u1', name: 'Alice', email: 'alice@test.com', streak_current: 5, streak_longest: 10, tasks_completed: 15 },
      ],
    });

    const { getStreakAnalytics } = await import('@/lib/db/analytics');
    const result = getStreakAnalytics();

    expect(result).toHaveProperty('distribution');
    expect(result).toHaveProperty('top_streaks');
    expect(result).toHaveProperty('summary');
  });
});
