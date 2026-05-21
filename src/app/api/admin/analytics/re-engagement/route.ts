import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseDateParams } from '@/lib/api-auth';
import { getReEngagementMetrics } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const report = getReEngagementMetrics(filters);
    return NextResponse.json(report);
  } catch (error) {
    console.error('[ReEngagement] Error:', error);
    return NextResponse.json({ error: 'Failed to load re-engagement metrics' }, { status: 500 });
  }
}
