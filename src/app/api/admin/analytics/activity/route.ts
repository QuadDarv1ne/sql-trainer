import { NextResponse } from 'next/server';
import { getDailyActivity, getDailyActivityWithFilters } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const activity =
    startDate && endDate
      ? getDailyActivityWithFilters(30, { start_date: startDate, end_date: endDate })
      : getDailyActivity(30);

  return NextResponse.json({
    activity,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
