import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getTeacherStudentProgress } from '@/lib/db-users';
import { TRAINING_TASKS } from '@/lib/training-tasks';
import { tWithLocale } from '@/lib/i18n';

const TOTAL_TASKS = TRAINING_TASKS.filter((t) => t.dbType === 'sqlite').length;

export const GET = withTeacherAuth(async ({ request }) => {
  const acceptLang = request.headers.get('accept-language') || '';
  const locale = acceptLang.startsWith('en') ? 'en' : 'ru';
  const t = (key: string, params?: Record<string, string | number>) => {
    let value = tWithLocale(locale, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, String(v));
      });
    }
    return value;
  };

  const students = getTeacherStudentProgress();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const alerts: Array<{
    type: 'at_risk' | 'inactive' | 'struggling' | 'excelling';
    studentId: string;
    studentName: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }> = [];

  for (const student of students) {
    if (student.tasks_completed < 5) {
      alerts.push({
        type: 'at_risk',
        studentId: student.user_id,
        studentName: student.name,
        message: t('teacher.alerts.atRisk', { completed: student.tasks_completed, total: TOTAL_TASKS }),
        severity: student.tasks_completed === 0 ? 'high' : 'medium',
      });
    }

    if (!student.last_active || student.last_active < now - sevenDays) {
      const daysInactive = student.last_active
        ? Math.floor((now - student.last_active) / (24 * 60 * 60 * 1000))
        : 'never';
      alerts.push({
        type: 'inactive',
        studentId: student.user_id,
        studentName: student.name,
        message:
          typeof daysInactive === 'number'
            ? t('teacher.alerts.inactive', { days: daysInactive })
            : t('teacher.alerts.neverLoggedIn'),
        severity: typeof daysInactive === 'number' && daysInactive > 14 ? 'high' : 'medium',
      });
    }

    if (student.avg_attempts > 4 && student.tasks_completed >= 3) {
      alerts.push({
        type: 'struggling',
        studentId: student.user_id,
        studentName: student.name,
        message: t('teacher.alerts.struggling', { attempts: student.avg_attempts, completed: student.tasks_completed }),
        severity: student.avg_attempts > 6 ? 'high' : 'medium',
      });
    }

    if (student.tasks_completed > 45 && student.avg_attempts < 2) {
      alerts.push({
        type: 'excelling',
        studentId: student.user_id,
        studentName: student.name,
        message: t('teacher.alerts.excelling', { completed: student.tasks_completed, attempts: student.avg_attempts }),
        severity: 'low',
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return NextResponse.json({ alerts });
});
