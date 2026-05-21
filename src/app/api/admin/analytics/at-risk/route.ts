import { withAdminAuth, parseDateParams } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getAtRiskStudents } from '@/lib/db-users';
import { getCached, setCached, SHORT_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cached = getCached('/api/admin/analytics/at-risk');
  if (cached) return NextResponse.json(cached);

  const data = getAtRiskStudents();
  const result = { atRiskStudents: data };
  setCached('/api/admin/analytics/at-risk', {}, result, SHORT_TTL);
  return NextResponse.json(result);
});
