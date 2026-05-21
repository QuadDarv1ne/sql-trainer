import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getRegistrationFunnel } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cacheKey = {};
  const cached = getCached('/api/admin/analytics/registration-funnel', cacheKey);
  if (cached) return NextResponse.json(cached);

  const data = getRegistrationFunnel();
  const result = { registrationFunnel: data };
  setCached('/api/admin/analytics/registration-funnel', cacheKey, result, STANDARD_TTL);
  return NextResponse.json(result);
});
