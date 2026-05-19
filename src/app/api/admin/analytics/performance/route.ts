import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getActiveUsersCount, getAvgAttemptsPerTask, getDBStats, getAllUsers } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activeUsers7d = getActiveUsersCount(7);
    const avgAttempts = getAvgAttemptsPerTask();
    const dbStats = getDBStats();
    const allUsers = getAllUsers();
    const students = allUsers.filter(u => u.role === 'student');
    const totalStudents = students.length;
    const studentsWithCompletions = students.filter(s => s.tasks_completed > 0).length;
    const completionRate = totalStudents > 0 ? Math.round((studentsWithCompletions / totalStudents) * 1000) / 10 : 0;

    return NextResponse.json({
      activeUsers7d,
      avgAttempts,
      totalStudents,
      completionRate,
    });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
