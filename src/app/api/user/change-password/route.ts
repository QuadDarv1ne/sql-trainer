import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserAuthStrict } from '@/lib/api-auth';
import { RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { findUserByIdWithHash, updatePassword } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { validateBody } from '@/lib/validation';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)'),
});

export const POST = withUserAuthStrict(
  async ({ session, request }) => {
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
  },
  { max: 5, windowMs: RATE_LIMIT_WINDOWS.fifteenMinutes },
);
