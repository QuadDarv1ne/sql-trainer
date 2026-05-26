import { z } from 'zod';
import { NextResponse } from 'next/server';
import { bulkUpdateRole, bulkSoftDelete } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

const bulkRoleSchema = z.object({
  action: z.literal('role'),
  userIds: z.array(z.string()).min(1, 'userIds must be a non-empty array'),
  role: z.enum(['student', 'teacher', 'admin'], { errorMap: () => ({ message: 'Invalid role' }) }),
});

const bulkDeleteSchema = z.object({
  action: z.literal('delete'),
  userIds: z.array(z.string()).min(1, 'userIds must be a non-empty array'),
});

const bulkActionSchema = z.discriminatedUnion('action', [bulkRoleSchema, bulkDeleteSchema]);

export const POST = withAdminAuth(async ({ session, request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const result = bulkActionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
  }

  const data = result.data;

  if (data.action === 'role') {
    const changed = bulkUpdateRole(data.userIds, data.role, session.user.id);
    return NextResponse.json({ success: true, changed });
  }

  if (data.userIds.includes(session.user.id)) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const deleted = bulkSoftDelete(data.userIds, session.user.id);
  return NextResponse.json({ success: true, deleted });
});
