import { withAdminAuth, parseDateParams } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getContentPerformance } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async ({ request }) => {
  const url = new URL(request.url);
  const dates = parseDateParams(url.searchParams);
  const filters =
    dates.startDate && dates.endDate ? { start_date: dates.startDate, end_date: dates.endDate } : undefined;

  const cacheKey = { startDate: dates.startDate, endDate: dates.endDate };
  const cached = getCached('/api/admin/analytics/content-performance', cacheKey);
  if (cached) return NextResponse.json(cached);

  const data = getContentPerformance(filters);
  const result = {
    contentPerformance: data,
    dateRange: filters ? { startDate: dates.startDate, endDate: dates.endDate } : null,
  };
  setCached('/api/admin/analytics/content-performance', cacheKey, result, STANDARD_TTL);
  return NextResponse.json(result);
});
