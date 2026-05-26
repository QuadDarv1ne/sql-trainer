import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { z } from 'zod';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

const roleUpdateSchema = z.object({
  role: z.enum(VALID_ROLES as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid role. Must be one of: student, teacher, admin' }),
  }),
});

export const PUT = withAdminAuth(async ({ session, request, params }) => {
  const { id } = params!;
  const body = await request.json();
  const validation = roleUpdateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors[0]?.message ?? 'Invalid role' }, { status: 400 });
  }

  const { role } = validation.data;

  const success = updateUserRole(id, role as UserRole, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, role });
});
