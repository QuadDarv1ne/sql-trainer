import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createResetCode, updatePassword, verifyResetCode, getUserById } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Request password reset code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Rate limit: max 3 requests per 15 minutes per email
    const rateLimitKey = `reset:${email}`;
    const limitResult = rateLimit(rateLimitKey, { max: 3, windowMs: 15 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много запросов. Попробуйте позже' },
        { status: 429 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true, message: 'Если email зарегистрирован, код отправлен' });
    }

    const code = await createResetCode(user.id, 'email');

    // In production: send code via email/SMS
    // For development: log confirmation without exposing the code
    if (process.env.NODE_ENV === 'development') {
      logger.info('Password reset code generated', { userId: user.id, channel: 'email' });
    }

    return NextResponse.json({
      success: true,
      message: 'Если email зарегистрирован, код восстановления отправлен',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// Reset password with code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, newPassword } = body;

    if (!code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Код и новый пароль обязательны' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // Rate limit: max 5 attempts per 15 minutes per code prefix
    const rateLimitKey = `reset-verify:${code.substring(0, 3)}`;
    const limitResult = rateLimit(rateLimitKey, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток. Попробуйте позже' },
        { status: 429 }
      );
    }

    const result = await verifyResetCode(code);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Неверный или просроченный код' },
        { status: 400 }
      );
    }

    const updated = await updatePassword(result.userId, newPassword);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Не удалось обновить пароль' },
        { status: 500 }
      );
    }

    const user = await getUserById(result.userId);
    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён',
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
