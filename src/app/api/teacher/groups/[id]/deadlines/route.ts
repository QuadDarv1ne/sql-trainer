import { z } from 'zod';
import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import {
  getGroupById,
  getGroupDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
  buildReminderSchedule,
} from '@/lib/db-users';
import { validateBody } from '@/lib/validation';

const createDeadlineSchema = z.object({
  type: z.enum(['course', 'exam', 'task', 'inactivity']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  taskId: z.string().optional().nullable(),
  dueAt: z.number().int().positive(),
});

export const GET = withTeacherAuth(async ({ session, request }) => {
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

  const deadlines = getGroupDeadlines(groupId);
  return NextResponse.json({ success: true, deadlines });
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

  const validation = validateBody(body, createDeadlineSchema);
  if ('response' in validation) return validation.response;

  const { type, title, description, taskId, dueAt } = validation.data;

  const deadline = createDeadline({
    creatorId: session.user.id,
    type,
    title,
    description,
    targetType: 'group',
    groupId,
    taskId: taskId || undefined,
    dueAt,
  }, session.user.id);

  buildReminderSchedule(deadline.id);

  return NextResponse.json({ success: true, deadline });
});

export const PATCH = withTeacherAuth(async ({ session, request }) => {
  const url = new URL(request.url);
  const groupId = url.pathname.split('/')[5];
  const deadlineId = url.searchParams.get('deadlineId');

  if (!groupId || !deadlineId) {
    return NextResponse.json({ success: false, error: 'Group ID and deadlineId are required' }, { status: 400 });
  }

  const group = getGroupById(groupId);
  if (!group || group.teacher_id !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateBody(body, createDeadlineSchema.partial());
  if ('response' in validation) return validation.response;

  const updated = updateDeadline(deadlineId, {
    type: validation.data.type,
    title: validation.data.title,
    description: validation.data.description,
    taskId: validation.data.taskId || undefined,
    dueAt: validation.data.dueAt,
  }, session.user.id, session.user.id);

  if (!updated) {
    return NextResponse.json({ success: false, error: 'Deadline not found' }, { status: 404 });
  }

  buildReminderSchedule(deadlineId);
  return NextResponse.json({ success: true });
});

export const DELETE = withTeacherAuth(async ({ session, request }) => {
  const url = new URL(request.url);
  const groupId = url.pathname.split('/')[5];
  const deadlineId = url.searchParams.get('deadlineId');

  if (!groupId || !deadlineId) {
    return NextResponse.json({ success: false, error: 'Group ID and deadlineId are required' }, { status: 400 });
  }

  const group = getGroupById(groupId);
  if (!group || group.teacher_id !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  deleteDeadline(deadlineId, session.user.id, session.user.id);
  return NextResponse.json({ success: true });
});
