import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProgress, saveUserProgress } from '@/lib/db-users';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    const progress = await getUserProgress(session.user.id);
    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('[API Error] GET /api/user/progress:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, attempts } = body;

    if (!taskId || attempts === undefined) {
      return NextResponse.json({ success: false, error: 'taskId и attempts обязательны' }, { status: 400 });
    }

    if (typeof attempts !== 'number' || attempts < 0 || !Number.isInteger(attempts)) {
      return NextResponse.json(
        { success: false, error: 'attempts должен быть неотрицательным целым числом' },
        { status: 400 }
      );
    }

    await saveUserProgress(session.user.id, taskId, attempts);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Error] POST /api/user/progress:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
