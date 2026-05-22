import { NextResponse } from 'next/server';
import { getTopicMastery } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const data = getTopicMastery();
  return NextResponse.json(data);
});
