import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createDeadline, getAllDeadlines, getDeadlinesForCreator, buildReminderSchedule } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    let deadlines;
    if (scope === 'all' && hasRole(userRole, 'admin')) {
      deadlines = getAllDeadlines();
    } else {
      deadlines = getDeadlinesForCreator(session.user.id);
    }

    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error('[API Error] GET /api/admin/deadlines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    });

    // Build reminder schedule for target users
    buildReminderSchedule(deadline.id);

    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    console.error('[API Error] POST /api/admin/deadlines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
