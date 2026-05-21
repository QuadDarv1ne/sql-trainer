import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getAttemptEfficiencyTrends } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cached = getCached('/api/admin/analytics/attempt-efficiency');
  if (cached) return NextResponse.json(cached);

  const data = getAttemptEfficiencyTrends();
  const result = { attemptEfficiency: data };
  setCached('/api/admin/analytics/attempt-efficiency', {}, result, STANDARD_TTL);
  return NextResponse.json(result);
});
