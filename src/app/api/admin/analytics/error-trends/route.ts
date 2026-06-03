import { NextResponse } from 'next/server';
import { getErrorTrendAnalysis } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const trends = getErrorTrendAnalysis(90, filters);
  return NextResponse.json({ trends });
});
