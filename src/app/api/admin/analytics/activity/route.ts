import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getDailyActivity, getDailyActivityWithFilters } from '@/lib/db-users';
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

    let activity;
    if (startDate && endDate) {
      activity = getDailyActivityWithFilters(30, { start_date: startDate, end_date: endDate });
    } else {
      activity = getDailyActivity(30);
    }
    return NextResponse.json({
      activity,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
    });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
