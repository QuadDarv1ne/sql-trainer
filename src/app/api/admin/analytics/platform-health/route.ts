import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getPlatformHealth } from '@/lib/db-users';
import { getCached, setCached, SHORT_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cacheKey = {};
  const cached = getCached('/api/admin/analytics/platform-health', cacheKey);
  if (cached) return NextResponse.json(cached);

  const data = getPlatformHealth();
  const result = { platformHealth: data };
  setCached('/api/admin/analytics/platform-health', cacheKey, result, SHORT_TTL);
  return NextResponse.json(result);
});
