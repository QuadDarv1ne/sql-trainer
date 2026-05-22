import { NextResponse } from 'next/server';
import { getTaskAnalytics } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const tasks = getTaskAnalytics(filters);
  return NextResponse.json({
    tasks,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
