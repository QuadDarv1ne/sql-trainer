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

describe('db/analytics — getNotificationPreferences', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return existing preferences', async () => {
    mockDb({
      'SELECT * FROM notification_preferences': [{
        user_id: 'u1',
        channels_enabled: '["in_app","email"]',
        reminder_intervals: '[86400000,3600000]',
        teacher_notify_students: 1,
        updated_at: Date.now(),
      }],
    });
    const { getNotificationPreferences } = await import('@/lib/db/analytics');
    const result = getNotificationPreferences('u1');
    expect(result.user_id).toBe('u1');
    expect(result.channels_enabled).toContain('in_app');
  });

  it('should create default preferences when none exist', async () => {
    mockDb({});
    const { getNotificationPreferences } = await import('@/lib/db/analytics');
    const result = getNotificationPreferences('u-new');
    expect(result.user_id).toBe('u-new');
    expect(result.channels_enabled).toContain('in_app');
    expect(result.reminder_intervals).toBeDefined();
  });
});

describe('db/analytics — getUserPushSubscriptions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return push subscriptions for a user', async () => {
    mockDb({
      'push_subscriptions WHERE user_id': [
        { id: 'ps1', user_id: 'u1', endpoint: 'https://fcm.googleapis.com/test', p256dh: 'key', auth: 'auth', created_at: Date.now(), last_used: Date.now() },
      ],
    });
    const { getUserPushSubscriptions } = await import('@/lib/db/analytics');
    const result = getUserPushSubscriptions('u1');
    expect(result.length).toBe(1);
    expect(result[0].endpoint).toContain('fcm.googleapis.com');
  });

  it('should return empty array when no subscriptions', async () => {
    mockDb({});
    const { getUserPushSubscriptions } = await import('@/lib/db/analytics');
    const result = getUserPushSubscriptions('u1');
    expect(result.length).toBe(0);
  });
});

describe('db/analytics — deletePushSubscription', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should delete a push subscription', async () => {
    const { runFn } = mockDb({});
    runFn.mockReturnValue({ changes: 1 });
    const { deletePushSubscription } = await import('@/lib/db/analytics');
    expect(deletePushSubscription('u1', 'https://endpoint')).toBe(true);
  });

  it('should return false when no subscription deleted', async () => {
    const { runFn } = mockDb({});
    runFn.mockReturnValue({ changes: 0 });
    const { deletePushSubscription } = await import('@/lib/db/analytics');
    expect(deletePushSubscription('u1', 'https://nonexistent')).toBe(false);
  });
});

describe('db/analytics — getDueReminders', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return due reminders', async () => {
    mockDb({
      'trigger_at <=': [
        { id: 'r1', deadline_id: 'd1', user_id: 'u1', channel: 'in_app', trigger_at: Date.now(), status: 'pending' },
      ],
    });
    const { getDueReminders } = await import('@/lib/db/analytics');
    const result = getDueReminders();
    expect(Array.isArray(result)).toBe(true);
  });
});
