import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { updateDeadline, deleteDeadline, getDeadlineById } from '@/lib/db-users';

export const PUT = withTeacherAuth(async ({ session, request, params }) => {
  const { id } = params!;
  const existing = getDeadlineById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
  }

  const body = await request.json();
  const success = updateDeadline(id, body, session.user.id, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });
  }

  const updated = getDeadlineById(id);
  return NextResponse.json({ success: true, deadline: updated });
});

export const DELETE = withTeacherAuth(async ({ session, params }) => {
  const { id } = params!;
  const success = deleteDeadline(id, session.user.id, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Deadline not found or forbidden' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
