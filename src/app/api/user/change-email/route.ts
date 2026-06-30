import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserByIdWithHash, findUserByEmail, updateUser } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';
import { validateCsrfTokenEdge, csrfErrorResponse } from '@/lib/csrf';

const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 401 });
    }

    // CSRF protection
    if (!validateCsrfTokenEdge(request)) {
      return csrfErrorResponse();
    }

    // Rate limit: 5 attempts per 15 minutes per user
    const limit = await rateLimit(`change-email:${session.user.id}`, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please try later' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const validation = validateBody(body, changeEmailSchema);
    if ('response' in validation) return validation.response;

    const { newEmail, password } = validation.data;

    // Verify password
    const user = await findUserByIdWithHash(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
    }

    // Check if email is already taken
    const existingUser = await findUserByEmail(newEmail);
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ success: false, error: 'This email is already in use' }, { status: 400 });
    }

    // Update email
    const updated = await updateUser(user.id, { email: newEmail });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email changed successfully', email: newEmail });
  } catch (error) {
    logger.error('POST /api/user/change-email:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
