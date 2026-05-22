import { NextResponse } from 'next/server';
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
  getStudentGradeDistribution,
  getStudentGrowthTrends,
} from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ searchParams }) => {
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
  if (exportAll || requestedSections.includes('grade')) {
    data.grade = getStudentGradeDistribution();
  }
  if (exportAll || requestedSections.includes('growth')) {
    data.growth = getStudentGrowthTrends(12);
  }

  return NextResponse.json({ data });
});
