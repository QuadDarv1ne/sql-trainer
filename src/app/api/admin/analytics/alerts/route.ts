import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { generateStudentAlerts } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const alerts = generateStudentAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
