import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail, createResetCode, updatePassword, verifyResetCode, getUserById } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const resetRequestSchema = z.object({
  email: z.string().email('Некорректный email'),
});

const resetConfirmSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  newPassword: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
});

// Request password reset code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

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
    logger.error('Reset password POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Reset password with code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetConfirmSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, newPassword } = result.data;

    // Rate limit: max 5 attempts per 15 minutes per code prefix
    const rateLimitKey = `reset-verify:${code.substring(0, 3)}`;
    const limitResult = rateLimit(rateLimitKey, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток. Попробуйте позже' },
        { status: 429 }
      );
    }

    const verifyResult = await verifyResetCode(code);
    if (!verifyResult) {
      return NextResponse.json(
        { success: false, error: 'Неверный или просроченный код' },
        { status: 400 }
      );
    }

    const updated = await updatePassword(verifyResult.userId, newPassword);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Не удалось обновить пароль' },
        { status: 500 }
      );
    }

    const user = await getUserById(verifyResult.userId);
    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён',
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });
  } catch (err: unknown) {
    logger.error('Reset password PUT error:', err);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
