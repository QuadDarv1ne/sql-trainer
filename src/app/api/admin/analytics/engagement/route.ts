import { NextResponse } from 'next/server';
import { getStudentEngagementMetrics } from '@/lib/db-users';
import { withAnalyticsAuth, positiveIntParam } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate, searchParams }) => {
  const limit = positiveIntParam(searchParams, 'limit', 200) ?? 50;
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;

  const metrics = getStudentEngagementMetrics(limit, filters);
  return NextResponse.json({ metrics });
});
