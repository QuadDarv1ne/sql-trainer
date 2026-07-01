import { z } from 'zod';
import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { softDeleteUser, updateUserDetails } from '@/lib/db-users';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';
import { validateBody } from '@/lib/validation';

export const DELETE = withAdminAuth(async ({ session, params }) => {
  if (!params?.id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  const { id } = params;

  // Prevent admin from deleting themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const success = softDeleteUser(id, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});

const adminUpdateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional().or(z.literal('')),
});

export const PUT = withAdminAuth(async ({ session, request, params }) => {
  if (!params?.id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  const { id } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = validateBody(body, adminUpdateUserSchema);
  if ('response' in result) return result.response;

  const { name, email, phone } = result.data;

  // Sanitize name and phone fields
  const sanitizedName = name !== undefined ? sanitizeName(name) : null;
  if (sanitizedName?.error) {
    return NextResponse.json({ error: sanitizedName.error }, { status: 400 });
  }
  const sanitizedPhone = phone !== undefined ? sanitizePhone(phone) : null;
  if (sanitizedPhone?.error) {
    return NextResponse.json({ error: sanitizedPhone.error }, { status: 400 });
  }

  if (id === session.user.id && email) {
    return NextResponse.json({ error: 'Cannot change your own email' }, { status: 400 });
  }

  const success = updateUserDetails(
    id,
    { name: sanitizedName?.value, email, phone: sanitizedPhone?.value },
    session.user.id,
  );
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
