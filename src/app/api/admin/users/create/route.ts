import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { z } from 'zod';
import { parseAndValidate } from '@/lib/validation';

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)'),
  phone: z.string().optional(),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
});

export const POST = withAdminAuth(async ({ request, session }) => {
  const validation = await parseAndValidate(request, createUserSchema);
  if ('response' in validation) return validation.response;

  const { email, name, password, phone, role } = validation.data;

  // Sanitize name
  const sanitizedName = sanitizeName(name);
  if (sanitizedName.error) {
    return NextResponse.json({ success: false, error: sanitizedName.error }, { status: 400 });
  }

  // Sanitize phone (optional field)
  const sanitizedPhone = phone ? sanitizePhone(phone) : { value: '' };
  if (sanitizedPhone.error) {
    return NextResponse.json({ success: false, error: sanitizedPhone.error }, { status: 400 });
  }

  const user = await createUser(
    email,
    sanitizedName.value,
    password,
    sanitizedPhone.value || undefined,
    role || 'student',
    session.user.id,
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});
