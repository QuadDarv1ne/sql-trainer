import { NextResponse } from 'next/server';
import { getTopicPerformanceAnalysis } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const topics = getTopicPerformanceAnalysis(filters);
  return NextResponse.json({
    topics,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined,
  });
});
