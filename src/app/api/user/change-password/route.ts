import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findUserByIdWithHash, updatePassword } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';
import { validateCsrfTokenEdge, csrfErrorResponse } from '@/lib/csrf';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)'),
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
    const limit = await rateLimit(`change-password:${session.user.id}`, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please try later' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const result = validateBody(body, changePasswordSchema);
    if ('response' in result) return result.response;

    const { currentPassword, newPassword } = result.data;

    // Verify current password
    const user = await findUserByIdWithHash(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid current password' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must differ from current password' },
        { status: 400 },
      );
    }

    // Update password
    const updated = await updatePassword(user.id, newPassword);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error('POST /api/user/change-password:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
