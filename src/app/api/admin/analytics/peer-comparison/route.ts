import { NextResponse } from 'next/server';
import { getPeerComparisonMatrix } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const comparisons = getPeerComparisonMatrix(filters);
  return NextResponse.json({
    comparisons,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined,
  });
});
