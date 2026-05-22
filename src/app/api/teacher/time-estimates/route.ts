import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getTimeToCompleteEstimates } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = getTimeToCompleteEstimates();
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('GET /api/teacher/time-estimates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
