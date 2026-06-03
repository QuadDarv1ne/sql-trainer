import { NextResponse } from 'next/server';
import { getCompletionDistribution } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const distribution = getCompletionDistribution(filters);
  return NextResponse.json({
    distribution,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
