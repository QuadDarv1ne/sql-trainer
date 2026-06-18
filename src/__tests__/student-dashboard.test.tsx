import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import StudentDashboard from '@/components/student/student-dashboard';
import { useSQLTrainerStore } from '@/lib/store';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock zustand store
vi.mock('@/lib/store', () => ({
  useSQLTrainerStore: vi.fn(),
}));

const mockStudentSession = {
  data: {
    user: {
      id: 'user-1',
      name: 'Test Student',
      email: 'student@test.com',
      role: 'student' as const,
    },
    expires: '2026-12-31',
  },
  status: 'authenticated' as const,
};

const mockProgressResponse = {
  success: true,
  progress: [
    { taskId: 'task-1', attempts: 1, completedAt: Date.now() - 86400000 },
    { taskId: 'task-2', attempts: 2, completedAt: Date.now() - 43200000 },
  ],
  streak: { currentStreak: 3, longestStreak: 5, totalPracticeDays: 10 },
  userStats: { level: 2, xp: 150, levelProgress: 50 },
  unlockedAchievements: [{ id: 'ach-1', title: 'First Steps', unlockedAt: Date.now() - 86400000 }],
};

const mockRecommendationsResponse = {
  success: true,
  recommendations: [
    {
      type: 'practice',
      task_id: 'task-3',
      title: 'Practice SELECT',
      description: 'Practice more SELECT queries',
      priority: 'high' as const,
    },
  ],
};

const mockRemindersResponse = {
  success: true,
  reminders: [
    {
      id: 'rem-1',
      message: 'Complete JOIN exercises',
      due_at: Date.now() + 86400000 * 2, // 2 days from now
      type: 'deadline',
    },
  ],
};

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockFetch.mockClear();

    (useSession as Mock).mockReturnValue(mockStudentSession);

    (useSQLTrainerStore as any).mockReturnValue({
      setCurrentTaskId: vi.fn(),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgressResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecommendationsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRemindersResponse),
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects non-student users to /app', () => {
    (useSession as Mock).mockReturnValue({
      ...mockStudentSession,
      data: {
        ...mockStudentSession.data,
        user: {
          ...mockStudentSession.data.user,
          role: 'teacher' as const,
        },
      },
    });

    render(<StudentDashboard />);

    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  it('shows loading state initially', () => {
    // Make fetch pending to show loading
    mockFetch.mockReturnValue(new Promise(() => {}));

    act(() => {
      render(<StudentDashboard />);
    });

    // Spinner element with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('fetches and displays student progress data', async () => {
    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome/i)).toBeTruthy();
    });

    // Welcome text includes the user name
    expect(screen.getByText(/Test Student/)).toBeTruthy();
    // Streak count
    expect(screen.getByText('3')).toBeTruthy();
    // Task count appears in multiple places - use getAllByText
    const taskCounts = screen.getAllByText(/2\s*\/\s*243/);
    expect(taskCounts.length).toBeGreaterThan(0);
  });

  it('displays recommendations card when available', async () => {
    render(<StudentDashboard />);

    await waitFor(() => {
      // Use getAllByText since "Recommendations" appears in subtitle and card title
      const recElements = screen.getAllByText(/Recommendations/i);
      expect(recElements.length).toBeGreaterThan(0);
    });

    // Check recommendation description is shown (unique text)
    expect(screen.getByText('Practice more SELECT queries')).toBeTruthy();
  });

  it('displays reminders card when available', async () => {
    render(<StudentDashboard />);

    await waitFor(() => {
      const reminderCards = screen.getAllByText(/Reminders/i);
      expect(reminderCards.length).toBeGreaterThan(0);
    });

    // Check reminder message is shown
    expect(screen.getByText('Complete JOIN exercises')).toBeTruthy();
  });

  it('shows error state when fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecommendationsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRemindersResponse),
      });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/i)).toBeTruthy();
    });
  });

  it('renders "Start task" button when there are incomplete tasks', async () => {
    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome/i)).toBeTruthy();
    });

    // The "Start task" button should be present
    const startButton = screen.getByRole('button', { name: /Start task/i });
    expect(startButton).toBeTruthy();
  });
});
