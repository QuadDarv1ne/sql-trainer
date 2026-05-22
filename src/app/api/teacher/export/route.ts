import { requireTeacher } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  getTeacherStudentProgress,
  getStudentEngagementMetrics,
  getTaskAnalytics,
  getErrorPatternAnalysis,
  getStudentSkillBreakdown,
  getTaskCompletionFunnel,
  getMasteryProgression,
} from '@/lib/db-users';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireTeacher();
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const includeProgress = searchParams.get('includeProgress') !== 'false';
    const includeEngagement = searchParams.get('includeEngagement') !== 'false';
    const includeAnalytics = searchParams.get('includeAnalytics') !== 'false';
    const includeSkills = searchParams.get('includeSkills') === 'true';
    const includeFunnel = searchParams.get('includeFunnel') === 'true';
    const includeMastery = searchParams.get('includeMastery') === 'true';

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

    if (includeSkills) {
      data.skills = getStudentSkillBreakdown();
    }

    if (includeFunnel) {
      data.funnel = getTaskCompletionFunnel();
    }

    if (includeMastery) {
      data.mastery = getMasteryProgression();
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('GET /api/teacher/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
