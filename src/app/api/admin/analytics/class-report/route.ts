import { NextResponse } from 'next/server';
import { generateClassReport } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const report = generateClassReport(filters);
  return NextResponse.json({
    report,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
