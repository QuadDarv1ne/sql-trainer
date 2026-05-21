import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseDateParams } from '@/lib/api-auth';
import { getActivitySummary } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const summary = getActivitySummary(filters);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[ActivitySummary] Error:', error);
    return NextResponse.json({ error: 'Failed to load activity summary' }, { status: 500 });
  }
}
