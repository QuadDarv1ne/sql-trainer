import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

const roleUpdateSchema = z.object({
  role: z.enum(VALID_ROLES as [string, ...string[]], {
    message: 'Invalid role. Must be one of: student, teacher, admin',
  }),
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

  const validation = validateBody(body, roleUpdateSchema);
  if ('response' in validation) return validation.response;

  const { role } = validation.data;

  const success = updateUserRole(id, role as UserRole, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, role });
});
