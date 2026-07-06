import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import { z } from 'zod';
import { parseAndValidate } from '@/lib/validation';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

const roleUpdateSchema = z.object({
  role: z.enum(VALID_ROLES as [string, ...string[]], {
    message: 'Invalid role. Must be one of: student, teacher, admin',
  }),
});

export const PUT = withAdminAuth(async ({ session, request, params }) => {
  if (!params?.id) {
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
  }
  const { id } = params;

  const validation = await parseAndValidate(request, roleUpdateSchema);
  if ('response' in validation) return validation.response;

  const { role } = validation.data;

  const success = updateUserRole(id, role as UserRole, session.user.id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, role });
});
