import { NextRequest } from 'next/server';
import { requireAdmin, parseDateParams } from '@/lib/api-auth';
import { getHintImpactAnalysis } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const dateParams = parseDateParams(searchParams);
  const filters = dateParams.startDate && dateParams.endDate
    ? { start_date: dateParams.startDate, end_date: dateParams.endDate }
    : undefined;

  const hints = getHintImpactAnalysis(filters);

  return Response.json({ hints, dateRange: dateParams.startDate && dateParams.endDate ? { startDate: dateParams.startDate, endDate: dateParams.endDate } : undefined });
}
