import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getStudyPatterns } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cached = getCached('/api/admin/analytics/study-patterns');
  if (cached) return NextResponse.json(cached);

  const data = getStudyPatterns();
  const result = { studyPatterns: data };
  setCached('/api/admin/analytics/study-patterns', {}, result, STANDARD_TTL);
  return NextResponse.json(result);
});
