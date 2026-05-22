import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getTeacherStudentProgress, getDBStats } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { TRAINING_TASKS } from '@/lib/training-tasks';

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

    const students = getTeacherStudentProgress();
    const dbStats = getDBStats();

    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.last_active && s.last_active > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
    const totalCompletions = students.reduce((sum, s) => sum + s.tasks_completed, 0);
    const avgCompletionRate = totalStudents > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.tasks_completed / TRAINING_TASKS.length) * 100, 0) / totalStudents)
      : 0;
    const atRiskCount = students.filter(s => s.tasks_completed < 5).length;
    const avgAttempts = students.length > 0
      ? Math.round((students.reduce((sum, s) => sum + s.avg_attempts, 0) / students.length) * 10) / 10
      : 0;

    return NextResponse.json({
      stats: {
        totalStudents,
        activeStudents,
        totalCompletions,
        avgCompletionRate,
        atRiskCount,
        avgAttempts,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/teacher/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
