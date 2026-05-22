import { NextResponse } from 'next/server';
import { restoreUser } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const POST = withAdminAuth(async ({ session, params }) => {
  const { id } = params!;

  const success = restoreUser(id, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'User not found or not deleted' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
