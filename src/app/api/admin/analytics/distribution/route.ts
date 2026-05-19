import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCompletionDistribution } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { parseDateParams } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const distribution = getCompletionDistribution(filters);
    return NextResponse.json({
      distribution,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
    });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
