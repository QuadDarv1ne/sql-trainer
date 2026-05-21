import { withAdminAuth, parseDateParams } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getExecutiveSummary } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async ({ request }) => {
  const url = new URL(request.url);
  const dates = parseDateParams(url.searchParams);

  const cacheKey = { startDate: dates.startDate, endDate: dates.endDate };
  const cached = getCached('/api/admin/analytics/executive-summary', cacheKey);
  if (cached) return NextResponse.json(cached);

  const filters = dates.startDate && dates.endDate
    ? { start_date: dates.startDate, end_date: dates.endDate }
    : undefined;

  const data = getExecutiveSummary(filters);
  const result = { executiveSummary: data, dateRange: filters ? { startDate: dates.startDate, endDate: dates.endDate } : null };
  setCached('/api/admin/analytics/executive-summary', cacheKey, result, STANDARD_TTL);
  return NextResponse.json(result);
});
