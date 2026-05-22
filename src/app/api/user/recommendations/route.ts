import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getStudentRecommendations } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || userRole !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recommendations = getStudentRecommendations(session.user.id);
    return NextResponse.json({ recommendations });
  } catch (error) {
    logger.error('GET /api/user/recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
