import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getTaskAnalytics, getErrorPatternAnalysis } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const taskStats = getTaskAnalytics();
    const errorPatterns = getErrorPatternAnalysis();

    // Calculate completion by difficulty level
    const completionByLevel = {
      beginner: taskStats.filter(t => t.difficulty === 'beginner').reduce((s, t) => s + t.completions, 0),
      intermediate: taskStats.filter(t => t.difficulty === 'intermediate').reduce((s, t) => s + t.completions, 0),
      advanced: taskStats.filter(t => t.difficulty === 'advanced').reduce((s, t) => s + t.completions, 0),
    };

    // Difficulty stats
    const difficultyStats = ['beginner', 'intermediate', 'advanced'].map(level => {
      const levelTasks = taskStats.filter(t => t.difficulty === level);
      return {
        difficulty: level,
        completed: levelTasks.reduce((s, t) => s + t.completions, 0),
        total: levelTasks.length,
        avgAttempts: levelTasks.length > 0
          ? Math.round((levelTasks.reduce((s, t) => s + t.avg_attempts, 0) / levelTasks.length) * 10) / 10
          : 0,
        firstAttemptRate: levelTasks.length > 0
          ? Math.round((levelTasks.reduce((s, t) => s + t.first_attempt_rate, 0) / levelTasks.length) * 10) / 10
          : 0,
      };
    });

    // Top tasks (most completions, lowest attempts)
    const topTasks = [...taskStats]
      .sort((a, b) => b.completions - a.completions || a.avg_attempts - b.avg_attempts)
      .slice(0, 10)
      .map(t => ({ task_id: t.task_id, completions: t.completions, avg_attempts: t.avg_attempts }));

    // Struggling tasks (highest avg attempts, highest failure rate)
    const strugglingTasks = errorPatterns
      .sort((a, b) => b.avg_attempts - a.avg_attempts)
      .slice(0, 10)
      .map(p => ({ task_id: p.task_id, avg_attempts: p.avg_attempts, failure_rate: p.failure_rate }));

    return NextResponse.json({
      analytics: {
        difficultyStats,
        completionByLevel,
        topTasks,
        strugglingTasks,
      },
    });
  } catch (error) {
    logger.error('GET /api/teacher/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
