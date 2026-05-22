import { NextResponse } from 'next/server';
import { getAuditTrail } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const GET = withAdminAuth(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const logs = getAuditTrail(Math.min(limit, 500), offset);
  return NextResponse.json({ logs });
});
