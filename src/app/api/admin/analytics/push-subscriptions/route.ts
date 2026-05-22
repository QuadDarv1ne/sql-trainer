import { NextResponse } from 'next/server';
import { getPushSubscriptionStats } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const stats = getPushSubscriptionStats();
  return NextResponse.json(stats);
});
