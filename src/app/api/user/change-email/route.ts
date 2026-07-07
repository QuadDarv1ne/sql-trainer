import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserAuthStrict } from '@/lib/api-auth';
import { RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { findUserByIdWithHash, findUserByEmail, updateUser } from '@/lib/db-users';
import bcrypt from 'bcryptjs';
import { parseAndValidate } from '@/lib/validation';

const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const POST = withUserAuthStrict(
  async ({ session, request }) => {
    const validation = await parseAndValidate(request, changeEmailSchema);
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
  },
  { max: 5, windowMs: RATE_LIMIT_WINDOWS.fifteenMinutes },
);
