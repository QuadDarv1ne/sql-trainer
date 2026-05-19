import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getActivityHeatmap } from '@/lib/db-users';
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

    const days = parseInt(request.nextUrl.searchParams.get('days') || '90');
    const data = getActivityHeatmap(days);
    const total = data.reduce((sum, d) => sum + d.completions, 0);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/activity-heatmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
