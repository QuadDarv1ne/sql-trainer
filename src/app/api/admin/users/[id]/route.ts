import { z } from 'zod';
import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { softDeleteUser, updateUserDetails } from '@/lib/db-users';
import { sanitizeName, sanitizePhone } from '@/lib/sanitization';

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

  const result = adminUpdateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, email, phone } = result.data;

  // Sanitize name and phone fields
  const sanitizedName = name ? sanitizeName(name).value : undefined;
  const sanitizedPhone = phone !== undefined ? sanitizePhone(phone).value : undefined;

  if (id === session.user.id && email) {
    return NextResponse.json({ error: 'Cannot change your own email' }, { status: 400 });
  }

  const success = updateUserDetails(id, { name: sanitizedName, email, phone: sanitizedPhone }, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
