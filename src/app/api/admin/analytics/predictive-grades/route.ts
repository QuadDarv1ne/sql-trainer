import { NextResponse } from 'next/server';
import { getPredictiveGrades } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const grades = getPredictiveGrades(filters);
  return NextResponse.json({
    grades,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined,
  });
});
