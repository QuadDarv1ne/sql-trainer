import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/db-users';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Имя не может быть пустым').max(100, 'Имя слишком длинное').optional(),
  phone: z.string().optional().or(z.literal('')),
});

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
    logger.error('GET /api/user/profile:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    // Rate limit: 10 profile updates per 15 minutes per user
    const limit = rateLimit(`profile-update:${session.user.id}`, { max: 10, windowMs: 15 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток. Попробуйте позже' }, { status: 429 });
    }

    const body = await request.json();
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, phone } = result.data;

    if (name !== undefined) {
      const sanitizedName = sanitizeName(name);
      if (sanitizedName.error) {
        return NextResponse.json(
          { success: false, error: sanitizedName.error },
          { status: 400 }
        );
      }
      body.name = sanitizedName.value;
    }

    if (phone !== undefined && phone !== '') {
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
    logger.error('PUT /api/user/profile:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
