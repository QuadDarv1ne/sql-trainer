import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db-users';

export const GET = withAdminAuth(async ({ session }) => {
  const users = getAllUsers();
  return NextResponse.json({ users });
});
