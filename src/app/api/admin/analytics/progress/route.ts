import { NextResponse } from 'next/server';
import { getWeeklyProgress } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const progress = getWeeklyProgress(12);
  return NextResponse.json({ progress });
});
