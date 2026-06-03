import { NextResponse } from 'next/server';
import { getAchievementStats } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const achievements = getAchievementStats(filters);
  return NextResponse.json({
    achievements,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
