import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getBannedUsers } from '@/lib/db-users';

export const GET = withAdminAuth(async () => {
  const users = getBannedUsers();
  return NextResponse.json({ users });
});
