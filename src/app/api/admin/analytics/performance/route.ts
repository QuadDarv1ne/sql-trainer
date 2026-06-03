import { NextResponse } from 'next/server';
import { getActiveUsersCount, getAvgAttemptsPerTask, getAllUsers } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;

  const activeUsers7d = getActiveUsersCount(7, filters);
  const avgAttempts = getAvgAttemptsPerTask(filters);
  const allUsers = getAllUsers();
  const students = allUsers.filter((u) => u.role === 'student');
  const totalStudents = students.length;
  const studentsWithCompletions = students.filter((s) => s.tasks_completed > 0).length;
  const completionRate = totalStudents > 0 ? Math.round((studentsWithCompletions / totalStudents) * 1000) / 10 : 0;

  return NextResponse.json({
    activeUsers7d,
    avgAttempts,
    totalStudents,
    completionRate,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
