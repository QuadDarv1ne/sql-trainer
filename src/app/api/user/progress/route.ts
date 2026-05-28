import { NextResponse } from 'next/server';
import { withUserAuth } from '@/lib/api-auth';
import { getUserProgress, saveUserProgress } from '@/lib/db-users';
import { z } from 'zod';

const progressSchema = z.object({
  taskId: z.string().min(1, 'taskId обязателен'),
  attempts: z.number().int().nonnegative('attempts должен быть неотрицательным целым числом'),
});

export const GET = withUserAuth(async ({ session }) => {
  const progress = await getUserProgress(session.user.id);
  return NextResponse.json({ success: true, progress });
});

export const POST = withUserAuth(async ({ session, request }) => {
  const body = await request.json();
  const validation = progressSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: validation.error.issues[0]?.message ?? 'Неверный формат данных' },
      { status: 400 }
    );
  }

  const { taskId, attempts } = validation.data;
  await saveUserProgress(session.user.id, taskId, attempts);
  return NextResponse.json({ success: true });
});
