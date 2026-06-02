import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail, createResetCode, updatePassword, verifyResetCode, getUserById, queueEmail } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { escapeHtml, getUserEmail } from '@/lib/email';
import { validateBody } from '@/lib/validation';
import { validateCsrfTokenEdge, csrfErrorResponse } from '@/lib/csrf';

const resetRequestSchema = z.object({
  email: z.string().email('Некорректный email'),
});

const resetConfirmSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  newPassword: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный (максимум 128 символов)'),
});

// Request password reset code
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateCsrfTokenEdge(request)) {
      return csrfErrorResponse();
    }

    const body = await request.json();
    const result = validateBody(body, resetRequestSchema);
    if ('response' in result) return result.response;

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

    // Queue the reset code email for delivery
    const userEmail = getUserEmail(user.id);
    if (userEmail) {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?code=${encodeURIComponent(code)}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">SQL Trainer</h1>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Ваш код для сброса пароля:</p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">
              ${escapeHtml(code)}
            </div>
            <p>Или перейдите по ссылке: <a href="${escapeHtml(resetUrl)}" style="color: #667eea;">Сбросить пароль</a></p>
            <p style="color: #6b7280; font-size: 14px;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
          </div>
        </body>
        </html>
      `;
      queueEmail(user.id, 'Сброс пароля — SQL Trainer', html);
      logger.info('Password reset code queued', { userId: user.id, email: userEmail });
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
    // CSRF protection
    if (!validateCsrfTokenEdge(request)) {
      return csrfErrorResponse();
    }

    const body = await request.json();
    const result = validateBody(body, resetConfirmSchema);
    if ('response' in result) return result.response;

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
