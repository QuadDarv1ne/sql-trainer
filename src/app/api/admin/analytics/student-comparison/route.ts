import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getStudentComparisonMetrics } from '@/lib/db-users';
import { getCached, setCached, SHORT_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async ({ request }) => {
  const url = new URL(request.url);
  const ids = url.searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'ids query param required (comma-separated)' }, { status: 400 });
  }

  const studentIds = ids.split(',').map(id => id.trim()).filter(Boolean);

  const cacheKey = { ids: studentIds.join(',') };
  const cached = getCached('/api/admin/analytics/student-comparison', cacheKey);
  if (cached) return NextResponse.json(cached);

  const data = getStudentComparisonMetrics(studentIds);
  const result = { comparisonData: data };
  setCached('/api/admin/analytics/student-comparison', cacheKey, result, SHORT_TTL);
  return NextResponse.json(result);
});
