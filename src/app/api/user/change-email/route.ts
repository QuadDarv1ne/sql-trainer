import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserByIdWithHash, findUserByEmail, updateUser } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';

const changeEmailSchema = z.object({
  newEmail: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    // Rate limit: 5 attempts per 15 minutes per user
    const limit = rateLimit(`change-email:${session.user.id}`, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток. Попробуйте позже' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateBody(body, changeEmailSchema);
    if ('response' in validation) return validation.response;

    const { newEmail, password } = validation.data;

    // Verify password
    const user = await findUserByIdWithHash(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль' },
        { status: 400 }
      );
    }

    // Check if email is already taken
    const existingUser = await findUserByEmail(newEmail);
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Этот email уже используется' },
        { status: 400 }
      );
    }

    // Update email
    const updated = await updateUser(user.id, { email: newEmail });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Не удалось обновить email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email успешно изменён', email: newEmail });
  } catch (error) {
    logger.error('POST /api/user/change-email:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
