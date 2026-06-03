import { z } from 'zod';
import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getGroupById, notifyGroupMembers } from '@/lib/db-users';
import { validateBody } from '@/lib/validation';

const notifySchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
  channel: z.enum(['email', 'in_app']).default('in_app'),
});

export const POST = withTeacherAuth(async ({ session, request }) => {
  const url = new URL(request.url);
  const groupId = url.pathname.split('/')[5];

  if (!groupId) {
    return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
  }

  const group = getGroupById(groupId);
  if (!group) {
    return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
  }

  if (group.teacher_id !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateBody(body, notifySchema);
  if ('response' in validation) return validation.response;

  const { subject, message, channel } = validation.data;

  const result = notifyGroupMembers(groupId, subject, message, channel, session.user.id);

  return NextResponse.json({ success: true, result });
});
