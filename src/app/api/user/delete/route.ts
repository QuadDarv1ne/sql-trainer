import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findUserByIdWithHash, softDeleteUser } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';

const deleteAccountSchema = z.object({
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

    // Rate limit: 3 attempts per 15 minutes per user
    const limit = rateLimit(`delete-account:${session.user.id}`, { max: 3, windowMs: 15 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток. Попробуйте позже' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = validateBody(body, deleteAccountSchema);
    if ('response' in result) return result.response;

    const { confirmPassword } = result.data;

    // Verify password before deletion
    const user = await findUserByIdWithHash(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(confirmPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль' },
        { status: 400 }
      );
    }

    // Soft delete user (preserves data for potential restoration and audit trail)
    const success = softDeleteUser(user.id, user.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Не удалось удалить аккаунт' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Аккаунт удалён' });
  } catch (error) {
    logger.error('DELETE /api/user/delete:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
