import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserAuthStrict } from '@/lib/api-auth';
import { RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { findUserByIdWithHash, softDeleteUser } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { parseAndValidate } from '@/lib/validation';

const deleteAccountSchema = z.object({
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
});

export const DELETE = withUserAuthStrict(
  async ({ session, request }) => {
    const result = await parseAndValidate(request, deleteAccountSchema);
    if ('response' in result) return result.response;

    const { confirmPassword } = result.data;

    // Verify password before deletion
    const user = await findUserByIdWithHash(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(confirmPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
    }

    // Soft delete user (preserves data for potential restoration and audit trail)
    const success = softDeleteUser(user.id, user.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account deleted' });
  },
  { max: 3, windowMs: RATE_LIMIT_WINDOWS.fifteenMinutes },
);
