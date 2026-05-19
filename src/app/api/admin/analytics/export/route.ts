import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyActivity,
  getTaskAnalytics,
  getCompletionDistribution,
  getAchievementStats,
  getAdminLeaderboard,
  getStudentPerformanceCards,
  getDifficultyComparison,
  generateClassReport,
  generateStudentAlerts,
  getWeeklyProgress,
  getCohortAnalysis,
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
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sections = searchParams.get('sections');
    const includeProgress = searchParams.get('includeProgress') === 'true';
    const includeAchievements = searchParams.get('includeAchievements') === 'true';
    const includeAttempts = searchParams.get('includeAttempts') === 'true';

    const requestedSections = sections ? sections.split(',') : ['all'];
    const exportAll = requestedSections.includes('all');

    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
    };

    if (exportAll || requestedSections.includes('activity')) {
      data.activity = getDailyActivity(30);
    }

    if (exportAll || requestedSections.includes('tasks')) {
      data.tasks = getTaskAnalytics();
    }

    if (exportAll || requestedSections.includes('distribution')) {
      data.distribution = getCompletionDistribution();
    }

    if (exportAll || requestedSections.includes('difficulty')) {
      data.difficulty = getDifficultyComparison();
    }

    if (exportAll || requestedSections.includes('leaderboard')) {
      data.leaderboard = getAdminLeaderboard(50);
    }

    if (exportAll || requestedSections.includes('students')) {
      data.students = getStudentPerformanceCards(50);
    }

    if (exportAll || requestedSections.includes('classReport')) {
      data.classReport = generateClassReport();
    }

    if (includeProgress || exportAll || requestedSections.includes('progress')) {
      data.progress = getWeeklyProgress(12);
    }

    if (includeProgress || exportAll || requestedSections.includes('cohort')) {
      data.cohort = getCohortAnalysis();
    }

    if (includeAchievements || exportAll || requestedSections.includes('achievements')) {
      data.achievements = getAchievementStats();
    }

    if (includeAttempts || exportAll || requestedSections.includes('alerts')) {
      data.alerts = generateStudentAlerts();
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
