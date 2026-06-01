import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { updateDeadline, deleteDeadline, getDeadlineById } from '@/lib/db-users';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

const updateDeadlineSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  courseId: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const PUT = withTeacherAuth(async ({ session, request, params }) => {
  if (!params?.id) {
    return NextResponse.json({ error: 'Deadline ID is required' }, { status: 400 });
  }
  const { id } = params;
  const existing = getDeadlineById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  const validation = validateBody(body, updateDeadlineSchema);
  if ('response' in validation) return validation.response;

  const success = updateDeadline(id, validation.data, session.user.id, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });
  }

  const updated = getDeadlineById(id);
  return NextResponse.json({ success: true, deadline: updated });
});

export const DELETE = withTeacherAuth(async ({ session, params }) => {
  if (!params?.id) {
    return NextResponse.json({ error: 'Deadline ID is required' }, { status: 400 });
  }
  const { id } = params;
  const success = deleteDeadline(id, session.user.id, session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Deadline not found or forbidden' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
