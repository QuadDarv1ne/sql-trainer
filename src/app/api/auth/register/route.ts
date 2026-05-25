import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { logger } from '@/lib/logger';

const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  phone: z.string().optional().or(z.literal('')),
});

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
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = result.data;

    const sanitizedName = sanitizeName(name);
    if (sanitizedName.error) {
      return NextResponse.json(
        { success: false, error: sanitizedName.error },
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
