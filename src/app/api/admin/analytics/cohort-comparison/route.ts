import { NextResponse } from 'next/server';
import { getCohortComparison } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const data = getCohortComparison();
  return NextResponse.json(data);
});
