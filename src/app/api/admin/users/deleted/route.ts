import { NextResponse } from 'next/server';
import { getDeletedUsers } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const GET = withAdminAuth(async () => {
  const users = getDeletedUsers();
  return NextResponse.json({ users });
});
