import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/db-users';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';

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
      if (typeof name !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Имя должно быть строкой' },
          { status: 400 }
        );
      }
      const sanitizedName = sanitizeName(name);
      if (sanitizedName.error) {
        return NextResponse.json(
          { success: false, error: sanitizedName.error },
          { status: 400 }
        );
      }
      body.name = sanitizedName.value;
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Телефон должен быть строкой' },
          { status: 400 }
        );
      }
      const sanitizedPhone = sanitizePhone(phone);
      if (sanitizedPhone.error) {
        return NextResponse.json(
          { success: false, error: sanitizedPhone.error },
          { status: 400 }
        );
      }
      body.phone = sanitizedPhone.value;
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
