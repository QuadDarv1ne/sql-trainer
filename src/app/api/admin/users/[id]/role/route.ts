import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

export const PUT = withAdminAuth(async ({ session, request, params }) => {
  const { id } = params!;
  const body = await request.json();
  const { role } = body;

  if (!role || !VALID_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const success = updateUserRole(id, role as UserRole, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, role });
});
