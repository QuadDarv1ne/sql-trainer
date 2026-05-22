import { NextResponse } from 'next/server';
import { getWeekOverWeekComparison } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const data = getWeekOverWeekComparison(filters);
  return NextResponse.json({ data });
});
