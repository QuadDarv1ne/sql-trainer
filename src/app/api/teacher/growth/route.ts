import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getStudentGrowthTrends } from '@/lib/db-users';
import { logger } from '@/lib/logger';

export async function GET() {
  const authResult = await requireTeacher();
  if (authResult.error) return authResult.error;

  try {
    const growth = getStudentGrowthTrends(12);
    return NextResponse.json({ growth });
  } catch (error) {
    logger.error('GET /api/teacher/growth:', error);
    return NextResponse.json({ error: 'Failed to load growth trends' }, { status: 500 });
  }
}
