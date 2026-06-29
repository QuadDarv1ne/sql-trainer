import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';

const ALLOWED_SELF_ROLES: UserRole[] = ['student', 'teacher'];

const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный (максимум 128 символов)'),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(ALLOWED_SELF_ROLES as [string, ...string[]]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 registrations per 10 minutes per client
    const clientId = getClientIdentifier(request);
    const limitResult = await rateLimit(`register:${clientId}`, { max: 5, windowMs: 10 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток регистрации. Попробуйте позже' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const result = validateBody(body, registerSchema);
    if ('response' in result) return result.response;

    const { name, email, password, phone, role } = result.data;

    const sanitizedName = sanitizeName(name);
    if (sanitizedName.error) {
      return NextResponse.json({ success: false, error: sanitizedName.error }, { status: 400 });
    }

    const sanitizedPhone = phone ? sanitizePhone(phone) : { value: '' };
    if (sanitizedPhone.error) {
      return NextResponse.json({ success: false, error: sanitizedPhone.error }, { status: 400 });
    }

    // Use requested role or default to 'student'; only allow self-registration roles
    const userRole: UserRole = role && ALLOWED_SELF_ROLES.includes(role as UserRole) ? (role as UserRole) : 'student';

    const user = await createUser(email, sanitizedName.value, password, sanitizedPhone.value || undefined, userRole);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Пользователь с таким email уже существует' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err: unknown) {
    logger.error('Registration error:', err);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
