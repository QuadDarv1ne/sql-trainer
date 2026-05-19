import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveUsersCount, getAvgAttemptsPerTask, getDBStats, getAllUsers } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { parseDateParams } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const activeUsers7d = getActiveUsersCount(7, filters);
    const avgAttempts = getAvgAttemptsPerTask(filters);
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
      dateRange: startDate && endDate ? { startDate, endDate } : null,
    });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
