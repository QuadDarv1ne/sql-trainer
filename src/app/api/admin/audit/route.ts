import { NextResponse } from 'next/server';
import { getAuditTrail } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const GET = withAdminAuth(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const limit = Number.isNaN(parseInt(searchParams.get('limit') || '100')) ? 100 : parseInt(searchParams.get('limit') || '100');
  const offset = Number.isNaN(parseInt(searchParams.get('offset') || '0')) ? 0 : parseInt(searchParams.get('offset') || '0');

  const logs = getAuditTrail(Math.min(limit, 500), offset);
  return NextResponse.json({ logs });
});
