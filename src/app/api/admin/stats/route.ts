import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getDBStats } from '@/lib/db-users';

export const GET = withAdminAuth(async () => {
  const stats = getDBStats();
  return NextResponse.json({ stats });
});
