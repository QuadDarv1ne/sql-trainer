import { NextResponse } from 'next/server';
import { getActivityHeatmap } from '@/lib/db-users';
import { withAnalyticsAuth, intParam } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate, searchParams }) => {
  const days =
    startDate && endDate
      ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      : (intParam(searchParams, 'days') ?? 90);
  const data = getActivityHeatmap(days);
  const total = data.reduce((sum, d) => sum + d.completions, 0);
  return NextResponse.json({
    data,
    total,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
