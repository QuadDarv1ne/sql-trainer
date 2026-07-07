import { z } from 'zod';
import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { banUser, isUserBanned } from '@/lib/db-users';
import { parseAndValidate } from '@/lib/validation';

const banSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export const POST = withAdminAuth(async ({ session, request, params }) => {
  if (!params?.id) {
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
  }
  const { id } = params;

  if (id === session.user.id) {
    return NextResponse.json({ success: false, error: 'Cannot ban your own account' }, { status: 400 });
  }

  if (isUserBanned(id)) {
    return NextResponse.json({ success: false, error: 'User is already banned' }, { status: 409 });
  }

  const result = await parseAndValidate(request, banSchema);
  if ('response' in result) return result.response;

  const reason = result.data.reason || null;
  const success = banUser(id, reason, session.user.id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
