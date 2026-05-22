import { NextResponse } from 'next/server';
import { getTaskCategoryPerformance } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const categories = getTaskCategoryPerformance(filters);
  return NextResponse.json({
    categories,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined,
  });
});
