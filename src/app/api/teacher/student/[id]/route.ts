import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getStudentDetail, getUserAchievements } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const limit = rateLimit(`teacher-student:${session.user.id}`, { max: 30, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного' }, { status: 429 });
    }

    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid student ID format' }, { status: 400 });
    }
    const student = getStudentDetail(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const achievements = await getUserAchievements(id);
    return NextResponse.json({ student, achievements });
  } catch (error) {
    logger.error('GET /api/teacher/student/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
