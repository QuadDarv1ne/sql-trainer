import { NextResponse } from 'next/server';
import { getStudentLearningPace } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate
    ? { start_date: startDate, end_date: endDate }
    : undefined;
  const pace = getStudentLearningPace(filters);
  return NextResponse.json({ pace });
});
