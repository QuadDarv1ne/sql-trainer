import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getStudentGradeDistribution } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET() {
  const authResult = await requireTeacher();
  if (authResult.error) return authResult.error;

  if (!authResult.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = authResult.session.user.id;
  const limit = rateLimit(`teacher-grade:${userId}`, { max: 30, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const distribution = getStudentGradeDistribution();
    return NextResponse.json({ distribution });
  } catch (error) {
    logger.error('GET /api/teacher/grade:', error);
    return NextResponse.json({ error: 'Failed to load grade distribution' }, { status: 500 });
  }
}
