import { NextResponse } from 'next/server';
import { getAuditTrail } from '@/lib/db-users';
import { withAdminAuth, positiveIntParam } from '@/lib/api-auth';

export const GET = withAdminAuth(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const limit = positiveIntParam(searchParams, 'limit', 500) ?? 100;
  const offset = positiveIntParam(searchParams, 'offset') ?? 0;

  const logs = getAuditTrail(Math.min(limit, 500), offset);
  return NextResponse.json({ success: true, logs });
});
