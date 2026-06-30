import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { apiServerError } from '@/lib/api-error';
import { validateBody } from '@/lib/validation';

const ALLOWED_SELF_ROLES: UserRole[] = ['student', 'teacher'];

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)'),
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
        { success: false, error: 'Too many registration attempts. Please try later' },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }
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
      return NextResponse.json({ success: false, error: 'A user with this email already exists' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err: unknown) {
    return apiServerError('Registration', undefined, err);
  }
}
