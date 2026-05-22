import { NextResponse } from 'next/server';
import { getActivitySummary } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const summary = getActivitySummary(filters);
  return NextResponse.json(summary);
});
