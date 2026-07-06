import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { createDeadline, getAllDeadlines, getDeadlinesForCreator, buildReminderSchedule } from '@/lib/db-users';
import { hasRole } from '@/lib/rbac';
import { z } from 'zod';
import { parseAndValidate } from '@/lib/validation';

const deadlineSchema = z.object({
  type: z.enum(['course', 'exam', 'task', 'inactivity']),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .refine((s) => !/<[^>]*>/.test(s), 'HTML content is not allowed in title'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .refine((s) => !/<[^>]*>/.test(s), 'HTML content is not allowed in description')
    .optional(),
  targetType: z.enum(['individual', 'group', 'all_students']),
  targetId: z.string().optional(),
  taskId: z.string().optional(),
  dueAt: z.number().or(z.string()).transform(Number),
});

export const GET = withTeacherAuth(async ({ session, request }) => {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const userRole = session.user.role;

  let deadlines;
  if (scope === 'all' && hasRole(userRole, 'admin')) {
    deadlines = getAllDeadlines();
  } else {
    deadlines = getDeadlinesForCreator(session.user.id);
  }

  return NextResponse.json({ success: true, deadlines });
});

export const POST = withTeacherAuth(async ({ session, request }) => {
  const parsed = await parseAndValidate(request, deadlineSchema);
  if ('response' in parsed) return parsed.response;

  const { type, title, description, targetType, targetId, taskId, dueAt } = parsed.data;

  const deadline = createDeadline(
    {
      creatorId: session.user.id,
      type,
      title,
      description,
      targetType,
      targetId,
      taskId,
      dueAt: Number(dueAt),
    },
    session.user.id,
  );

  // Build reminder schedule for target users
  buildReminderSchedule(deadline.id);

  return NextResponse.json({ success: true, deadline });
});
