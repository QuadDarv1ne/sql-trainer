import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseDateParams } from '@/lib/api-auth';
import { getHintUsageAnalytics } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const report = getHintUsageAnalytics(filters);
    return NextResponse.json(report);
  } catch (error) {
    console.error('[HintUsage] Error:', error);
    return NextResponse.json({ error: 'Failed to load hint usage analytics' }, { status: 500 });
  }
}
