import { NextResponse } from 'next/server';
import { bulkUpdateRole, bulkSoftDelete } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

const VALID_ROLES = ['student', 'teacher', 'admin'] as const;

export const POST = withAdminAuth(async ({ session, request }) => {
  const body = await request.json();
  const { action, userIds, role } = body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds must be a non-empty array' }, { status: 400 });
  }

  if (action === 'role') {
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const changed = bulkUpdateRole(userIds, role, session.user.id);
    return NextResponse.json({ success: true, changed });
  }

  if (action === 'delete') {
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    const deleted = bulkSoftDelete(userIds, session.user.id);
    return NextResponse.json({ success: true, deleted });
  }

  return NextResponse.json({ error: 'Invalid action. Must be "role" or "delete"' }, { status: 400 });
});
