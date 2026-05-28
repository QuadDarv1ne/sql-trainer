import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCohortAnalysis } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

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

    // Rate limit: 30 requests per minute per teacher
    const limit = rateLimit(`teacher-cohort:${session.user.id}`, { max: 30, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного' }, { status: 429 });
    }

    const data = getCohortAnalysis();
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('GET /api/teacher/cohort:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
