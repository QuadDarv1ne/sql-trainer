import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 registrations per 10 minutes per IP
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const limitResult = rateLimit(`register:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток регистрации. Попробуйте позже' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Имя, email и пароль обязательны' },
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

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный email' },
        { status: 400 }
      );
    }

    const sanitizedPhone = phone ? sanitizePhone(phone) : { value: '' };
    if (sanitizedPhone.error) {
      return NextResponse.json(
        { success: false, error: sanitizedPhone.error },
        { status: 400 }
      );
    }

    // Always assign 'student' role — role changes must be done by admin
    const userRole: UserRole = 'student';

    const user = await createUser(email, sanitizedName.value, password, sanitizedPhone.value || undefined, userRole);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err: unknown) {
    logger.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
