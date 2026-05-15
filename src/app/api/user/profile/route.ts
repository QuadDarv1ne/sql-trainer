import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/db-users';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[API Error] GET /api/user/profile:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Имя должно быть строкой от 1 до 100 символов' },
          { status: 400 }
        );
      }
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return NextResponse.json(
          { success: false, error: 'Телефон должен быть строкой до 20 символов' },
          { status: 400 }
        );
      }
    }

    const updated = await updateUser(session.user.id, { name, phone });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Не удалось обновить профиль' }, { status: 500 });
    }

    const user = await getUserById(session.user.id);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[API Error] PUT /api/user/profile:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
