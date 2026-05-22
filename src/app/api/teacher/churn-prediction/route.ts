import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getChurnPredictions } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const predictions = getChurnPredictions(limit);
    return NextResponse.json({ predictions });
  } catch (error) {
    logger.error('GET /api/teacher/churn-prediction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
