import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getAcademicTimeline } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
  }

  const cacheKey = { userId };
  const cached = getCached('/api/admin/analytics/academic-timeline', cacheKey);
  if (cached) return NextResponse.json(cached);

  const data = getAcademicTimeline(userId);
  const result = { timeline: data };
  setCached('/api/admin/analytics/academic-timeline', cacheKey, result, STANDARD_TTL);
  return NextResponse.json(result);
});
