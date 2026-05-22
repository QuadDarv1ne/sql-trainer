import { NextResponse } from 'next/server';
import { getHintImpactAnalysis } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const hints = getHintImpactAnalysis(filters);
  return NextResponse.json({
    hints,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined,
  });
});
