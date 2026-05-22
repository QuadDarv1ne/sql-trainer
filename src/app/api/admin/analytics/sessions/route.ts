import { NextResponse } from 'next/server';
import { getSessionAnalysis } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const sessions = getSessionAnalysis();
  return NextResponse.json({ sessions });
});
