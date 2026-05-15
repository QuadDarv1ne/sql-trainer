import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createResetCode, updatePassword, verifyResetCode, getUserById } from '@/lib/db-users';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return false;
  }

  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

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
    if (!checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)) {
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
    // For development: log to server console only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MVP] Reset code for ${email}: ${code}`);
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
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
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
