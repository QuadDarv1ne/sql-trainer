import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  getTeacherStudentProgress,
  getStudentEngagementMetrics,
  getTaskAnalytics,
  getErrorPatternAnalysis,
} from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeProgress = searchParams.get('includeProgress') !== 'false';
    const includeEngagement = searchParams.get('includeEngagement') !== 'false';
    const includeAnalytics = searchParams.get('includeAnalytics') !== 'false';

    const data: Record<string, unknown> = {};

    if (includeProgress) {
      data.students = getTeacherStudentProgress();
    }

    if (includeEngagement) {
      data.engagement = getStudentEngagementMetrics(50);
    }

    if (includeAnalytics) {
      data.tasks = getTaskAnalytics();
      data.errorPatterns = getErrorPatternAnalysis();
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API Error] GET /api/teacher/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
