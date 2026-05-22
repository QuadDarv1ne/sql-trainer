import { NextResponse } from 'next/server';
import { getLiveActivity } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const live = getLiveActivity();
  return NextResponse.json(live);
});
