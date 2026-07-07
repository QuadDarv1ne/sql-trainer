import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/db-users';

export const GET = withAdminAuth(async () => {
  const health = getSystemHealth();
  return NextResponse.json({ success: true, health });
});
