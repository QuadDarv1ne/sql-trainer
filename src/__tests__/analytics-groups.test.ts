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

describe('db/analytics — getGroupById', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return null for non-existent group', async () => {
    mockDb({});
    const { getGroupById } = await import('@/lib/db/analytics');
    expect(getGroupById('nonexistent')).toBeNull();
  });

  it('should return group with member count', async () => {
    mockDb({
      'g.id, g.name, g.description': [{
        id: 'g1', name: 'SQL Basics', description: 'Beginner group',
        teacher_id: 't1', teacher_name: 'Prof. Smith', member_count: 5,
        created_at: Date.now(), updated_at: Date.now(),
      }],
    });
    const { getGroupById } = await import('@/lib/db/analytics');
    const result = getGroupById('g1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('SQL Basics');
    expect(result!.member_count).toBe(5);
  });
});

describe('db/analytics — getGroupsByTeacherId', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return groups for a teacher', async () => {
    mockDb({
      'g.teacher_id = ?': [
        { id: 'g1', name: 'Group A', member_count: 3, teacher_name: 'Prof', created_at: Date.now(), updated_at: Date.now() },
        { id: 'g2', name: 'Group B', member_count: 7, teacher_name: 'Prof', created_at: Date.now(), updated_at: Date.now() },
      ],
    });
    const { getGroupsByTeacherId } = await import('@/lib/db/analytics');
    const result = getGroupsByTeacherId('t1');
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Group A');
  });
});

describe('db/analytics — getGroupMembers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return group members', async () => {
    mockDb({
      'group_members gm': [
        { user_id: 'u1', name: 'Alice', email: 'alice@test.com', joined_at: Date.now() },
        { user_id: 'u2', name: 'Bob', email: 'bob@test.com', joined_at: Date.now() },
      ],
    });
    const { getGroupMembers } = await import('@/lib/db/analytics');
    const result = getGroupMembers('g1');
    expect(result.length).toBe(2);
    expect(result[0].user_id).toBe('u1');
  });
});

describe('db/analytics — getUserGroups', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return groups for a user', async () => {
    mockDb({
      'g.id, g.name, g.description': [
        { id: 'g1', name: 'Group A', description: 'Desc', teacher_name: 'Prof. Smith', member_count: 5, created_at: Date.now(), updated_at: Date.now() },
      ],
    });
    const { getUserGroups } = await import('@/lib/db/analytics');
    const result = getUserGroups('u1');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Group A');
  });
});

describe('db/analytics — getUserGroup', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return null when user has no group', async () => {
    mockDb({});
    const { getUserGroup } = await import('@/lib/db/analytics');
    expect(getUserGroup('u1')).toBeNull();
  });

  it('should return the user group', async () => {
    mockDb({
      'g.id, g.name, g.description': [{
        id: 'g1', name: 'My Group', description: 'Desc', teacher_name: 'Prof. Smith', member_count: 3, created_at: Date.now(), updated_at: Date.now(),
      }],
    });
    const { getUserGroup } = await import('@/lib/db/analytics');
    const result = getUserGroup('u1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('My Group');
  });
});

describe('db/analytics — getAllGroupsForAdmin', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return all groups for admin', async () => {
    mockDb({
      'g.id, g.name, g.description': [
        { id: 'g1', name: 'Group A', description: 'Desc', teacher_name: 'Prof', member_count: 5, created_at: Date.now(), updated_at: Date.now() },
      ],
    });
    const { getAllGroupsForAdmin } = await import('@/lib/db/analytics');
    const result = getAllGroupsForAdmin();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Group A');
  });
});
