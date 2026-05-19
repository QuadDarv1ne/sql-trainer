import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getTeacherStudentProgress } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

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
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    const alerts: Array<{
      type: 'at_risk' | 'inactive' | 'struggling' | 'excelling';
      studentId: string;
      studentName: string;
      message: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    for (const student of students) {
      // At risk: completed < 5 tasks
      if (student.tasks_completed < 5) {
        alerts.push({
          type: 'at_risk',
          studentId: student.user_id,
          studentName: student.name,
          message: `Выполнено только ${student.tasks_completed} из 56 заданий`,
          severity: student.tasks_completed === 0 ? 'high' : 'medium',
        });
      }

      // Inactive: no activity for 7+ days
      if (!student.last_active || student.last_active < now - sevenDays) {
        const daysInactive = student.last_active
          ? Math.floor((now - student.last_active) / (24 * 60 * 60 * 1000))
          : 'never';
        alerts.push({
          type: 'inactive',
          studentId: student.user_id,
          studentName: student.name,
          message: typeof daysInactive === 'number'
            ? `Нет активности ${daysInactive} дней`
            : 'Ни разу не входил в систему',
          severity: typeof daysInactive === 'number' && daysInactive > 14 ? 'high' : 'medium',
        });
      }

      // Struggling: high avg attempts
      if (student.avg_attempts > 4 && student.tasks_completed >= 3) {
        alerts.push({
          type: 'struggling',
          studentId: student.user_id,
          studentName: student.name,
          message: `Среднее число попыток: ${student.avg_attempts} (выполнено: ${student.tasks_completed})`,
          severity: student.avg_attempts > 6 ? 'high' : 'medium',
        });
      }

      // Excelling: high completion with low attempts
      if (student.tasks_completed > 45 && student.avg_attempts < 2) {
        alerts.push({
          type: 'excelling',
          studentId: student.user_id,
          studentName: student.name,
          message: `Отличная успеваемость: ${student.tasks_completed} заданий, ср. ${student.avg_attempts} попытки`,
          severity: 'low',
        });
      }
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[API Error] GET /api/teacher/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
