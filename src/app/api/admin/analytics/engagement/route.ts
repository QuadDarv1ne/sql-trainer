import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getStudentEngagementMetrics } from '@/lib/db-users';
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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const metrics = getStudentEngagementMetrics(limit);
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/engagement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
