/**
 * Tests for the user progress API endpoint.
 * Tests getting and saving user progress.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api-auth', () => ({
  withUserAuth: vi.fn((handler) => handler),
}));

vi.mock('@/lib/db-users', () => ({
  getUserProgress: vi.fn(),
  saveUserProgress: vi.fn(),
}));

vi.mock('@/lib/validation', () => ({
  parseAndValidate: vi.fn(),
}));

describe('User Progress API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/progress', () => {
    it('should return user progress', async () => {
      const { getUserProgress } = await import('@/lib/db-users');
      vi.mocked(getUserProgress).mockResolvedValue([
        { task_id: 'task-001', completed_at: Date.now(), attempts: 5 },
        { task_id: 'task-002', completed_at: Date.now(), attempts: 3 },
      ]);

      const { GET } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const response = await GET({
        session: mockSession,
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress).toEqual([
        { task_id: 'task-001', completed_at: expect.any(Number), attempts: 5 },
        { task_id: 'task-002', completed_at: expect.any(Number), attempts: 3 },
      ]);
      expect(getUserProgress).toHaveBeenCalledWith('user-123');
    });

    it('should return empty progress for new user', async () => {
      const { getUserProgress } = await import('@/lib/db-users');
      vi.mocked(getUserProgress).mockResolvedValue([]);

      const { GET } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'new-user', email: 'new@example.com' },
      };

      const response = await GET({
        session: mockSession,
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress).toEqual([]);
    });
  });

  describe('POST /api/user/progress', () => {
    it('should save user progress with valid data', async () => {
      const { parseAndValidate } = await import('@/lib/validation');
      const { saveUserProgress } = await import('@/lib/db-users');

      vi.mocked(parseAndValidate).mockResolvedValue({
        data: { taskId: 'task-001', attempts: 3 },
      });
      vi.mocked(saveUserProgress).mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/user/progress', {
        method: 'POST',
        body: JSON.stringify({ taskId: 'task-001', attempts: 3 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({
        session: mockSession,
        request: mockRequest,
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(saveUserProgress).toHaveBeenCalledWith('user-123', 'task-001', 3);
    });

    it('should reject invalid taskId', async () => {
      const { parseAndValidate } = await import('@/lib/validation');

      vi.mocked(parseAndValidate).mockResolvedValue({
        response: NextResponse.json(JSON.stringify({ error: 'taskId is required' }), { status: 400 }),
      });

      const { POST } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/user/progress', {
        method: 'POST',
        body: JSON.stringify({ taskId: '', attempts: 3 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({
        session: mockSession,
        request: mockRequest,
      } as any);

      expect(response.status).toBe(400);
    });

    it('should reject negative attempts', async () => {
      const { parseAndValidate } = await import('@/lib/validation');

      vi.mocked(parseAndValidate).mockResolvedValue({
        response: NextResponse.json(JSON.stringify({ error: 'attempts must be a non-negative integer' }), {
          status: 400,
        }),
      });

      const { POST } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/user/progress', {
        method: 'POST',
        body: JSON.stringify({ taskId: 'task-001', attempts: -1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({
        session: mockSession,
        request: mockRequest,
      } as any);

      expect(response.status).toBe(400);
    });

    it('should reject non-integer attempts', async () => {
      const { parseAndValidate } = await import('@/lib/validation');

      vi.mocked(parseAndValidate).mockResolvedValue({
        response: NextResponse.json(JSON.stringify({ error: 'attempts must be an integer' }), { status: 400 }),
      });

      const { POST } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/user/progress', {
        method: 'POST',
        body: JSON.stringify({ taskId: 'task-001', attempts: 3.5 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({
        session: mockSession,
        request: mockRequest,
      } as any);

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      const { parseAndValidate } = await import('@/lib/validation');
      const { saveUserProgress } = await import('@/lib/db-users');

      vi.mocked(parseAndValidate).mockResolvedValue({
        data: { taskId: 'task-001', attempts: 3 },
      });
      vi.mocked(saveUserProgress).mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/user/progress/route');

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/user/progress', {
        method: 'POST',
        body: JSON.stringify({ taskId: 'task-001', attempts: 3 }),
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(
        POST({
          session: mockSession,
          request: mockRequest,
        } as any),
      ).rejects.toThrow('Database error');
    });
  });
});
