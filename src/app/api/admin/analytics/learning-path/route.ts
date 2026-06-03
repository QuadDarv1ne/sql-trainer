import { NextResponse } from 'next/server';
import { getLearningPathEffectiveness } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const paths = getLearningPathEffectiveness(filters);
  return NextResponse.json({
    paths,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined,
  });
});
