import { NextResponse } from 'next/server';
import { getStudentPerformanceCards } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const students = getStudentPerformanceCards(50, filters);
  return NextResponse.json({
    students,
    dateRange: startDate && endDate ? { startDate, endDate } : null,
  });
});
