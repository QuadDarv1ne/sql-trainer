import { withUserAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getUserGroups } from '@/lib/db-users';

export const GET = withUserAuth(async ({ session }) => {
  const groups = getUserGroups(session.user.id);
  return NextResponse.json({ success: true, groups });
});
