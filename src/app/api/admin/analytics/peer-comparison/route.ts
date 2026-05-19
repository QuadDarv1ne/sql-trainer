import { NextRequest } from 'next/server';
import { requireAdmin, parseDateParams } from '@/lib/api-auth';
import { getPeerComparisonMatrix } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.success) return admin.response;

  const { searchParams } = new URL(request.url);
  const { filters } = parseDateParams(searchParams);

  const comparisons = getPeerComparisonMatrix(filters);

  return Response.json({ comparisons, dateRange: filters ? { startDate: filters.start_date, endDate: filters.end_date } : undefined });
}
