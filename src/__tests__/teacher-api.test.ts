/**
 * Integration tests for teacher API routes.
 * Tests group CRUD, members, deadlines, stats, and analytics endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock db-users
const mockDb = {
  getGroupsByTeacherId: vi.fn().mockReturnValue([]),
  createGroup: vi.fn().mockReturnValue({ id: 'g1', name: 'Test Group', teacher_id: 'teacher1' }),
  getGroupById: vi.fn().mockReturnValue(null),
  updateGroup: vi.fn().mockReturnValue({ id: 'g1', name: 'Updated' }),
  deleteGroup: vi.fn().mockReturnValue(true),
  getGroupMembers: vi.fn().mockReturnValue([]),
  addGroupMembers: vi.fn().mockReturnValue(1),
  removeGroupMember: vi.fn().mockReturnValue(true),
  getGroupDeadlines: vi.fn().mockReturnValue([]),
  createDeadline: vi.fn().mockReturnValue({ id: 'd1', title: 'Deadline' }),
  updateDeadline: vi.fn().mockReturnValue(true),
  deleteDeadline: vi.fn().mockReturnValue(true),
  buildReminderSchedule: vi.fn(),
  notifyGroupMembers: vi.fn().mockReturnValue({ notified: 2 }),
  getTeacherStudentProgress: vi.fn().mockReturnValue([]),
  getTaskAnalytics: vi.fn().mockReturnValue([]),
  getErrorPatternAnalysis: vi.fn().mockReturnValue([]),
  getStudentEngagementMetrics: vi.fn().mockReturnValue({}),
  getStudentSkillBreakdown: vi.fn().mockReturnValue([]),
  getTaskCompletionFunnel: vi.fn().mockReturnValue([]),
  getMasteryProgression: vi.fn().mockReturnValue([]),
  getStudentGradeDistribution: vi.fn().mockReturnValue([]),
  getStudentGrowthTrends: vi.fn().mockReturnValue([]),
  getChurnPredictions: vi.fn().mockReturnValue([]),
  getTimeToCompleteEstimates: vi.fn().mockReturnValue([]),
  generateRecommendations: vi.fn().mockReturnValue([]),
  getCohortAnalysis: vi.fn().mockReturnValue([]),
  getDb: vi.fn(),
  getStudentDetail: vi.fn().mockReturnValue(null),
  getUserAchievements: vi.fn().mockReturnValue([]),
  isStudentInTeacherGroup: vi.fn().mockReturnValue(false),
};

vi.mock('@/lib/db-users', () => mockDb);

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  t: (key: string) => key,
}));

// Mock withTeacherAuth to call handler directly with mock session
vi.mock('@/lib/api-auth', () => ({
  withTeacherAuth: (
    handler: (ctx: {
      session: { user: { id: string; name: string; role: string } };
      request: NextRequest;
      params?: Record<string, string>;
    }) => Promise<Response>,
  ) => {
    return async (req: NextRequest, ctx?: { params?: Record<string, string> }) => {
      return handler({
        session: { user: { id: 'teacher1', name: 'Test Teacher', role: 'teacher' } },
        request: req,
        params: ctx?.params,
      });
    };
  },
}));

// Mock validation to pass through
vi.mock('@/lib/validation', () => ({
  validateBody: (body: unknown, _schema: unknown) => ({ data: body }),
}));

// Mock training-tasks for stats
vi.mock('@/lib/training-tasks', () => ({
  TRAINING_TASKS: Array.from({ length: 20 }, (_, i) => ({ id: `task-${i}`, title: `Task ${i}` })),
}));

function makeRequest(url: string, method = 'GET', body?: unknown) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

describe('Teacher API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/teacher/groups', () => {
    it('returns teacher groups', async () => {
      mockDb.getGroupsByTeacherId.mockReturnValue([{ id: 'g1', name: 'Group A', teacher_id: 'teacher1' }]);

      const { GET } = await import('@/app/api/teacher/groups/route');
      const res = await GET(makeRequest('http://localhost/api/teacher/groups'));
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.groups).toHaveLength(1);
      expect(mockDb.getGroupsByTeacherId).toHaveBeenCalledWith('teacher1');
    });
  });

  describe('POST /api/teacher/groups', () => {
    it('creates a group', async () => {
      mockDb.createGroup.mockReturnValue({ id: 'g2', name: 'New Group', teacher_id: 'teacher1' });

      const { POST } = await import('@/app/api/teacher/groups/route');
      const res = await POST(makeRequest('http://localhost/api/teacher/groups', 'POST', { name: 'New Group' }));
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.group.name).toBe('New Group');
      expect(mockDb.createGroup).toHaveBeenCalled();
    });
  });

  describe('GET /api/teacher/groups/[id]', () => {
    it('returns 404 for non-existent group', async () => {
      mockDb.getGroupById.mockReturnValue(null);

      const { GET } = await import('@/app/api/teacher/groups/[id]/route');
      const res = await GET(makeRequest('http://localhost/api/teacher/groups/g1'), {
        params: { id: 'g1' },
      });
      const data = await res.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Group not found');
    });

    it('returns 403 for forbidden group', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'other-teacher' });

      const { GET } = await import('@/app/api/teacher/groups/[id]/route');
      const res = await GET(makeRequest('http://localhost/api/teacher/groups/g1'), {
        params: { id: 'g1' },
      });
      const data = await res.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden');
    });

    it('returns group with members', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'teacher1' });
      mockDb.getGroupMembers.mockReturnValue([{ id: 'student1' }]);

      const { GET } = await import('@/app/api/teacher/groups/[id]/route');
      const res = await GET(makeRequest('http://localhost/api/teacher/groups/g1'), {
        params: { id: 'g1' },
      });
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.group.members).toHaveLength(1);
    });
  });

  describe('DELETE /api/teacher/groups/[id]', () => {
    it('deletes group', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'teacher1' });
      mockDb.deleteGroup.mockReturnValue(true);

      const { DELETE } = await import('@/app/api/teacher/groups/[id]/route');
      const res = await DELETE(makeRequest('http://localhost/api/teacher/groups/g1', 'DELETE'), {
        params: { id: 'g1' },
      });
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(mockDb.deleteGroup).toHaveBeenCalledWith('g1', 'teacher1');
    });
  });

  describe('POST /api/teacher/groups/[id]/members', () => {
    it('adds members to group', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'teacher1' });
      mockDb.addGroupMembers.mockReturnValue(2);
      mockDb.getGroupMembers.mockReturnValue([{ id: 's1' }, { id: 's2' }]);

      const { POST } = await import('@/app/api/teacher/groups/[id]/members/route');
      const res = await POST(
        makeRequest('http://localhost/api/teacher/groups/g1/members', 'POST', { userIds: ['s1', 's2'] }),
        { params: { id: 'g1' } },
      );
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.added).toBe(2);
      expect(mockDb.addGroupMembers).toHaveBeenCalledWith('g1', ['s1', 's2'], 'teacher1');
    });
  });

  describe('DELETE /api/teacher/groups/[id]/members', () => {
    it('removes member from group', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'teacher1' });
      mockDb.getGroupMembers.mockReturnValue([]);

      const { DELETE } = await import('@/app/api/teacher/groups/[id]/members/route');
      const url = 'http://localhost/api/teacher/groups/g1/members?userId=s1';
      const res = await DELETE(makeRequest(url, 'DELETE'), { params: { id: 'g1' } });
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(mockDb.removeGroupMember).toHaveBeenCalledWith('g1', 's1', 'teacher1');
    });
  });

  describe('GET /api/teacher/stats', () => {
    it('returns stats with empty students', async () => {
      mockDb.getTeacherStudentProgress.mockReturnValue([]);

      const { GET } = await import('@/app/api/teacher/stats/route');
      const res = await GET(makeRequest('http://localhost/api/teacher/stats'));
      const data = await res.json();

      expect(data.stats.totalStudents).toBe(0);
      expect(data.stats.avgCompletionRate).toBe(0);
    });

    it('calculates stats correctly', async () => {
      mockDb.getTeacherStudentProgress.mockReturnValue([
        { tasks_completed: 10, avg_attempts: 2.5, last_active: Date.now() },
        { tasks_completed: 3, avg_attempts: 4.0, last_active: Date.now() - 8 * 24 * 60 * 60 * 1000 },
      ]);

      const { GET } = await import('@/app/api/teacher/stats/route');
      const res = await GET(makeRequest('http://localhost/api/teacher/stats'));
      const data = await res.json();

      expect(data.stats.totalStudents).toBe(2);
      expect(data.stats.activeStudents).toBe(1);
      expect(data.stats.totalCompletions).toBe(13);
      expect(data.stats.atRiskCount).toBe(1);
      expect(data.stats.avgAttempts).toBe(3.3);
    });
  });

  describe('POST /api/teacher/groups/[id]/deadlines', () => {
    it('creates a deadline', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'teacher1' });
      mockDb.createDeadline.mockReturnValue({ id: 'd1', title: 'Exam' });

      const { POST } = await import('@/app/api/teacher/groups/[id]/deadlines/route');
      const res = await POST(
        makeRequest('http://localhost/api/teacher/groups/g1/deadlines', 'POST', {
          type: 'exam',
          title: 'Exam',
          dueAt: Date.now() + 86400000,
        }),
        { params: { id: 'g1' } },
      );
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(mockDb.createDeadline).toHaveBeenCalled();
      expect(mockDb.buildReminderSchedule).toHaveBeenCalled();
    });
  });

  describe('POST /api/teacher/groups/[id]/notify', () => {
    it('sends notification to group', async () => {
      mockDb.getGroupById.mockReturnValue({ id: 'g1', teacher_id: 'teacher1' });
      mockDb.notifyGroupMembers.mockReturnValue({ notified: 3 });

      const { POST } = await import('@/app/api/teacher/groups/[id]/notify/route');
      const res = await POST(
        makeRequest('http://localhost/api/teacher/groups/g1/notify', 'POST', {
          subject: 'Reminder',
          message: 'Deadline tomorrow',
          channel: 'in_app',
        }),
        { params: { id: 'g1' } },
      );
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.result.notified).toBe(3);
    });
  });
});
