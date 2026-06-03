import { NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ startDate, endDate }) => {
  const filters = startDate && endDate ? { start_date: startDate, end_date: endDate } : undefined;
  const recommendations = generateRecommendations(filters);
  return NextResponse.json({ recommendations });
});
