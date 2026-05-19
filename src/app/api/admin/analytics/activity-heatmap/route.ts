import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getActivityHeatmap } from '@/lib/db-users';
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

    const days = filters
      ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      : parseInt(searchParams.get('days') || '90');
    const data = getActivityHeatmap(days, filters);
    const total = data.reduce((sum, d) => sum + d.completions, 0);

    return NextResponse.json({
      data,
      total,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
    });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/activity-heatmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
