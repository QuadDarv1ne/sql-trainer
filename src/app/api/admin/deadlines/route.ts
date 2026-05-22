import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { createDeadline, getAllDeadlines, getDeadlinesForCreator, buildReminderSchedule } from '@/lib/db-users';
import { hasRole } from '@/lib/rbac';

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

  return NextResponse.json({ deadlines });
});

export const POST = withTeacherAuth(async ({ session, request }) => {
  const body = await request.json();
  const { type, title, description, targetType, targetId, taskId, dueAt } = body;

  if (!type || !title || !targetType || !dueAt) {
    return NextResponse.json({ error: 'Missing required fields: type, title, targetType, dueAt' }, { status: 400 });
  }

  const validTypes = ['course', 'exam', 'task', 'inactivity'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
  }

  const validTargetTypes = ['individual', 'group', 'all_students'];
  if (!validTargetTypes.includes(targetType)) {
    return NextResponse.json({ error: `Invalid targetType. Must be one of: ${validTargetTypes.join(', ')}` }, { status: 400 });
  }

  const deadline = createDeadline({
    creatorId: session.user.id,
    type,
    title,
    description,
    targetType,
    targetId,
    taskId,
    dueAt: Number(dueAt),
  }, session.user.id);

  // Build reminder schedule for target users
  buildReminderSchedule(deadline.id);

  return NextResponse.json({ success: true, deadline });
});
