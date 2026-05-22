import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getTaskCompletionFunnel } from '@/lib/db-users';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { error } = await requireTeacher();
    if (error) return error;

    const funnel = getTaskCompletionFunnel();
    return NextResponse.json({ funnel });
  } catch (error) {
    logger.error('GET /api/teacher/funnel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
