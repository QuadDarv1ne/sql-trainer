import { NextResponse } from 'next/server';
import { getRetentionCohorts } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const data = getRetentionCohorts();
  return NextResponse.json(data);
});
