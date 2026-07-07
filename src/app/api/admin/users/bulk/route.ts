import { z } from 'zod';
import { NextResponse } from 'next/server';
import { bulkUpdateRole, bulkSoftDelete } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';
import { parseAndValidate } from '@/lib/validation';

const bulkRoleSchema = z.object({
  action: z.literal('role'),
  userIds: z.array(z.string()).min(1, 'userIds must be a non-empty array'),
  role: z.enum(['student', 'teacher', 'admin'], { message: 'Invalid role' }),
});

const bulkDeleteSchema = z.object({
  action: z.literal('delete'),
  userIds: z.array(z.string()).min(1, 'userIds must be a non-empty array'),
});

const bulkActionSchema = z.discriminatedUnion('action', [bulkRoleSchema, bulkDeleteSchema]);

export const POST = withAdminAuth(async ({ session, request }) => {
  const result = await parseAndValidate(request, bulkActionSchema);
  if ('response' in result) return result.response;

  const data = result.data;

  if (data.action === 'role') {
    const changed = bulkUpdateRole(data.userIds, data.role, session.user.id);
    return NextResponse.json({ success: true, changed });
  }

  if (data.userIds.includes(session.user.id)) {
    return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
  }

  const deleted = bulkSoftDelete(data.userIds, session.user.id);
  return NextResponse.json({ success: true, deleted });
});
