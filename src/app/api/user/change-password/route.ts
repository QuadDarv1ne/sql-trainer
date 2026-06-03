import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findUserByIdWithHash, updatePassword } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';
import { validateCsrfTokenEdge, csrfErrorResponse } from '@/lib/csrf';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный (максимум 128 символов)'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    // CSRF protection
    if (!validateCsrfTokenEdge(request)) {
      return csrfErrorResponse();
    }

    // Rate limit: 5 attempts per 15 minutes per user
    const limit = await rateLimit(`change-password:${session.user.id}`, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток. Попробуйте позже' }, { status: 429 });
    }

    const body = await request.json();
    const result = validateBody(body, changePasswordSchema);
    if ('response' in result) return result.response;

    const { currentPassword, newPassword } = result.data;

    // Verify current password
    const user = await findUserByIdWithHash(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Неверный текущий пароль' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'Новый пароль должен отличаться от текущего' },
        { status: 400 },
      );
    }

    // Update password
    const updated = await updatePassword(user.id, newPassword);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Не удалось обновить пароль' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Пароль успешно изменён' });
  } catch (error) {
    logger.error('POST /api/user/change-password:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
