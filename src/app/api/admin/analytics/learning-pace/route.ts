import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getStudentLearningPace } from '@/lib/db-users';
import { parseDateParams } from '@/lib/api-auth';
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
    const { startDate, endDate } = parseDateParams(searchParams);
    const filters = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

    const pace = getStudentLearningPace(filters);
    return NextResponse.json({ pace });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/learning-pace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
