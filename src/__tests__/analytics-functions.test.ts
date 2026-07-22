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

describe('db/analytics — getTaskAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return enriched task analytics', async () => {
    mockDb({
      'GROUP BY task_id': [
        { task_id: 'beginner-1', completions: 5, avg_attempts: 1.5, first_attempt_rate: 60 },
      ],
    });

    const { getTaskAnalytics } = await import('@/lib/db/analytics');
    const result = getTaskAnalytics();

    expect(result.length).toBe(1);
    expect(result[0].task_id).toBe('beginner-1');
    expect(result[0].completions).toBe(5);
    expect(result[0].avg_attempts).toBe(1.5);
  });

  it('should apply time range filters', async () => {
    const prepareFn = mockDb({
      'GROUP BY task_id': [],
    });

    const { getTaskAnalytics } = await import('@/lib/db/analytics');
    getTaskAnalytics({ start_date: 1000, end_date: 2000 });

    expect(prepareFn).toHaveBeenCalled();
  });
});

describe('db/analytics — getCompletionDistribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 5 completion buckets', async () => {
    mockDb({
      'tasks_completed BETWEEN': [],
    });

    const { getCompletionDistribution } = await import('@/lib/db/analytics');
    const result = getCompletionDistribution();

    expect(result.length).toBe(5);
    expect(result[0].range).toBe('0-5');
    expect(result[4].range).toBe('36-56');
  });

  it('should default student_count to 0 when no data', async () => {
    mockDb({
      'tasks_completed BETWEEN': [],
    });

    const { getCompletionDistribution } = await import('@/lib/db/analytics');
    const result = getCompletionDistribution();

    for (const bucket of result) {
      expect(bucket.student_count).toBe(0);
    }
  });
});

describe('db/analytics — getStudentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for non-existent user', async () => {
    mockDb({});

    const { getStudentDetail } = await import('@/lib/db/analytics');
    const result = getStudentDetail('nonexistent');

    expect(result).toBeNull();
  });

  it('should return student detail with achievements count', async () => {
    mockDb({
      'u.id as user_id': [
        {
          user_id: 'u1',
          name: 'Alice',
          email: 'alice@test.com',
          role: 'student',
          created_at: Date.now(),
          tasks_completed: 10,
          total_attempts: 15,
          avg_attempts: 1.5,
          beginner_completed: 5,
          intermediate_completed: 3,
          advanced_completed: 2,
          last_active: Date.now(),
        },
      ],
      'COUNT(*) as count FROM user_achievements': [{ count: 3 }],
    });

    const { getStudentDetail } = await import('@/lib/db/analytics');
    const result = getStudentDetail('u1');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Alice');
    expect(result!.tasks_completed).toBe(10);
    expect(result!.achievements_count).toBe(3);
  });
});

describe('db/analytics — generateStudentAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no students', async () => {
    mockDb({});

    const { generateStudentAlerts } = await import('@/lib/db/analytics');
    const result = generateStudentAlerts();

    expect(result).toEqual([]);
  });

  it('should detect inactive students', async () => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    mockDb({
      'u.id, u.name, u.email, u.created_at': [
        {
          id: 'u1',
          name: 'Bob',
          email: 'bob@test.com',
          created_at: Date.now(),
          last_active: thirtyDaysAgo,
          tasks_completed: 5,
          avg_attempts: 1.2,
        },
      ],
    });

    const { generateStudentAlerts } = await import('@/lib/db/analytics');
    const result = generateStudentAlerts();

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((a) => a.alert_type === 'inactive')).toBe(true);
  });

  it('should detect struggling students', async () => {
    mockDb({
      'u.id, u.name, u.email, u.created_at': [
        {
          id: 'u2',
          name: 'Charlie',
          email: 'charlie@test.com',
          created_at: Date.now(),
          last_active: Date.now(),
          tasks_completed: 5,
          avg_attempts: 4.5,
        },
      ],
    });

    const { generateStudentAlerts } = await import('@/lib/db/analytics');
    const result = generateStudentAlerts();

    expect(result.some((a) => a.alert_type === 'struggling')).toBe(true);
  });
});

describe('db/analytics — generateRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should recommend practice_more for low activity students', async () => {
    mockDb({
      'u.id, u.name, u.email': [
        {
          id: 'u3',
          name: 'Dave',
          email: 'dave@test.com',
          tasks_completed: 3,
          avg_attempts: 1.5,
          beginner_completed: 2,
          intermediate_completed: 1,
          advanced_completed: 0,
        },
      ],
    });

    const { generateRecommendations } = await import('@/lib/db/analytics');
    const result = generateRecommendations();

    expect(result.some((r) => r.recommendation_type === 'practice_more')).toBe(true);
  });

  it('should recommend review_basics for struggling beginners', async () => {
    mockDb({
      'u.id, u.name, u.email': [
        {
          id: 'u4',
          name: 'Eve',
          email: 'eve@test.com',
          tasks_completed: 12,
          avg_attempts: 4.0,
          beginner_completed: 2,
          intermediate_completed: 8,
          advanced_completed: 2,
        },
      ],
    });

    const { generateRecommendations } = await import('@/lib/db/analytics');
    const result = generateRecommendations();

    expect(result.some((r) => r.recommendation_type === 'review_basics')).toBe(true);
  });
});
