import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { softDeleteUser, updateUserDetails } from '@/lib/db-users';

export const DELETE = withAdminAuth(async ({ session, params }) => {
  const { id } = params!;

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

export const PUT = withAdminAuth(async ({ session, request, params }) => {
  const { id } = params!;
  const body = await request.json();
  const { name, email, phone } = body;

  if (id === session.user.id && email) {
    return NextResponse.json({ error: 'Cannot change your own email' }, { status: 400 });
  }

  const success = updateUserDetails(id, { name, email, phone }, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
