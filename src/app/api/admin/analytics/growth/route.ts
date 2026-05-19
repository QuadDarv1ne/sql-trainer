import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseDateParams } from '@/lib/api-auth';
import { getStudentGrowthTrends } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const growth = getStudentGrowthTrends(12, filters);
    return NextResponse.json({ growth });
  } catch (error) {
    console.error('[GrowthTrends] Error:', error);
    return NextResponse.json({ error: 'Failed to load growth trends' }, { status: 500 });
  }
}
