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

describe('db/analytics — getDeadlineById', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return undefined for non-existent deadline', async () => {
    mockDb({});
    const { getDeadlineById } = await import('@/lib/db/analytics');
    expect(getDeadlineById('nonexistent')).toBeFalsy();
  });

  it('should return deadline by id', async () => {
    mockDb({
      'SELECT * FROM deadlines': [{
        id: 'd1', creator_id: 't1', type: 'exam', title: 'SQL Final',
        description: 'Final exam', target_type: 'all_students',
        target_id: null, group_id: null, task_id: null,
        due_at: Date.now() + 86400000, created_at: Date.now(), updated_at: Date.now(),
      }],
    });
    const { getDeadlineById } = await import('@/lib/db/analytics');
    const result = getDeadlineById('d1');
    expect(result).toBeDefined();
    expect(result!.title).toBe('SQL Final');
    expect(result!.type).toBe('exam');
  });
});

describe('db/analytics — getDeadlinesForCreator', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return deadlines for a creator', async () => {
    mockDb({
      'SELECT * FROM deadlines WHERE creator_id': [
        { id: 'd1', title: 'Quiz 1', due_at: Date.now() },
        { id: 'd2', title: 'Quiz 2', due_at: Date.now() + 86400000 },
      ],
    });
    const { getDeadlinesForCreator } = await import('@/lib/db/analytics');
    const result = getDeadlinesForCreator('t1');
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Quiz 1');
  });
});

describe('db/analytics — getAllDeadlines', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return all deadlines', async () => {
    mockDb({
      'SELECT * FROM deadlines ORDER BY': [
        { id: 'd1', title: 'Deadline 1' },
        { id: 'd2', title: 'Deadline 2' },
      ],
    });
    const { getAllDeadlines } = await import('@/lib/db/analytics');
    const result = getAllDeadlines();
    expect(result.length).toBe(2);
  });
});

describe('db/analytics — resolveDeadlineTargets', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should resolve all_students target', async () => {
    mockDb({
      "role = 'student' AND banned_at": [
        { id: 's1' }, { id: 's2' }, { id: 's3' },
      ],
    });
    const { resolveDeadlineTargets } = await import('@/lib/db/analytics');
    const result = resolveDeadlineTargets({
      id: 'd1', creator_id: 't1', type: 'exam', title: 'Test',
      target_type: 'all_students', due_at: Date.now(),
      created_at: Date.now(), updated_at: Date.now(),
    } as any);
    expect(result).toEqual(['s1', 's2', 's3']);
  });

  it('should resolve individual target', async () => {
    mockDb({});
    const { resolveDeadlineTargets } = await import('@/lib/db/analytics');
    const result = resolveDeadlineTargets({
      id: 'd1', creator_id: 't1', type: 'exam', title: 'Test',
      target_type: 'individual', target_id: 's1', due_at: Date.now(),
      created_at: Date.now(), updated_at: Date.now(),
    } as any);
    expect(result).toEqual(['s1']);
  });

  it('should resolve group target', async () => {
    mockDb({
      'SELECT user_id FROM group_members WHERE group_id': [
        { user_id: 's1' }, { user_id: 's2' },
      ],
    });
    const { resolveDeadlineTargets } = await import('@/lib/db/analytics');
    const result = resolveDeadlineTargets({
      id: 'd1', creator_id: 't1', type: 'exam', title: 'Test',
      target_type: 'group', group_id: 'g1', due_at: Date.now(),
      created_at: Date.now(), updated_at: Date.now(),
    } as any);
    expect(result).toEqual(['s1', 's2']);
  });

  it('should return empty array for unknown target type', async () => {
    mockDb({});
    const { resolveDeadlineTargets } = await import('@/lib/db/analytics');
    const result = resolveDeadlineTargets({
      id: 'd1', creator_id: 't1', type: 'exam', title: 'Test',
      target_type: 'unknown', due_at: Date.now(),
      created_at: Date.now(), updated_at: Date.now(),
    } as any);
    expect(result).toEqual([]);
  });
});
