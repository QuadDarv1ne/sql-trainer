import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProgress, saveUserProgress } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const progressSchema = z.object({
  taskId: z.string().min(1, 'taskId обязателен'),
  attempts: z.number().int().nonnegative('attempts должен быть неотрицательным целым числом'),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    const progress = await getUserProgress(session.user.id);
    return NextResponse.json({ success: true, progress });
  } catch (error) {
    logger.error('GET /api/user/progress:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    // Rate limit: 60 progress saves per minute per user
    const limit = rateLimit(`progress:${session.user.id}`, { max: 60, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток. Подождите' }, { status: 429 });
    }

    const body = await request.json();
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message ?? 'Неверный формат данных' },
        { status: 400 }
      );
    }

    const { taskId, attempts } = validation.data;

    await saveUserProgress(session.user.id, taskId, attempts);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/user/progress:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
