import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProgress, saveUserProgress } from '@/lib/db-users';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const progress = await getUserProgress(session.user.id);
  return NextResponse.json({ success: true, progress });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const body = await request.json();
  const { taskId, attempts } = body;

  if (!taskId || attempts === undefined) {
    return NextResponse.json({ success: false, error: 'taskId и attempts обязательны' }, { status: 400 });
  }

  await saveUserProgress(session.user.id, taskId, attempts);
  return NextResponse.json({ success: true });
}
