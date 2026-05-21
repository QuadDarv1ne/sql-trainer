import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getAggregatePerformance } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cacheKey = {};
  const cached = getCached('/api/admin/analytics/aggregate-performance', cacheKey);
  if (cached) return NextResponse.json(cached);

  const data = getAggregatePerformance();
  const result = { aggregatePerformance: data };
  setCached('/api/admin/analytics/aggregate-performance', cacheKey, result, STANDARD_TTL);
  return NextResponse.json(result);
});
