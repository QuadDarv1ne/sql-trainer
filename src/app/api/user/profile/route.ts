import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/db-users';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone } = body;

  const updated = await updateUser(session.user.id, { name, phone });
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Не удалось обновить профиль' }, { status: 500 });
  }

  const user = await getUserById(session.user.id);
  return NextResponse.json({ success: true, user });
}
