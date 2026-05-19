import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getDailyActivity, getDailyActivityWithFilters } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let activity;
    if (startDate && endDate) {
      activity = getDailyActivityWithFilters(30, { start_date: parseInt(startDate), end_date: parseInt(endDate) });
    } else {
      activity = getDailyActivity(30);
    }
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
