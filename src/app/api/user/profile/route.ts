import { withUserAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserById, updateUser } from '@/lib/db-users';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { rateLimit } from '@/lib/rate-limit';
import { validateBody } from '@/lib/validation';

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Имя не может быть пустым').max(100, 'Имя слишком длинное').optional(),
  phone: z.string().optional().or(z.literal('')),
});

export const GET = withUserAuth(async ({ session }) => {
  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 });
  }
  return NextResponse.json({ success: true, user });
});

export const PUT = withUserAuth(async ({ request, session }) => {
  // Stricter rate limit for profile updates: 10 per 15 minutes
  const limit = await rateLimit(`profile-update:${session.user.id}`, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ success: false, error: 'Слишком много попыток. Попробуйте позже' }, { status: 429 });
  }

  const result = validateBody(await request.json(), profileUpdateSchema);
  if ('response' in result) return result.response;

  const { name, phone } = result.data;

  const sanitizedName = name !== undefined ? sanitizeName(name) : null;
  if (sanitizedName?.error) {
    return NextResponse.json({ success: false, error: sanitizedName.error }, { status: 400 });
  }

  const sanitizedPhone = phone !== undefined && phone !== '' ? sanitizePhone(phone) : null;
  if (sanitizedPhone?.error) {
    return NextResponse.json({ success: false, error: sanitizedPhone.error }, { status: 400 });
  }

  const updated = await updateUser(session.user.id, {
    name: sanitizedName?.value ?? name,
    phone: sanitizedPhone?.value ?? phone,
  });
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Не удалось обновить профиль' }, { status: 500 });
  }

  const user = await getUserById(session.user.id);
  return NextResponse.json({ success: true, user });
});
