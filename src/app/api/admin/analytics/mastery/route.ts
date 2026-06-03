import { NextResponse } from 'next/server';
import { getMasteryProgression } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const days = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 90;
  const weeks = Math.max(1, Math.ceil(days / 7));
  const progression = getMasteryProgression(weeks, filters);
  return NextResponse.json({ progression });
});
