import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getGroupsByTeacherId, createGroup } from '@/lib/db-users';

export const GET = withTeacherAuth(async ({ session }) => {
  const groups = getGroupsByTeacherId(session.user.id);
  return NextResponse.json({ success: true, groups });
});

export const POST = withTeacherAuth(async ({ session, request }) => {
  try {
    const body = await request.json();
    const { name, description, memberIds } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Group name is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Group name must be less than 100 characters' },
        { status: 400 },
      );
    }

    if (description && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json(
        { success: false, error: 'Description must be less than 500 characters' },
        { status: 400 },
      );
    }

    if (memberIds && (!Array.isArray(memberIds) || memberIds.some((id: unknown) => typeof id !== 'string'))) {
      return NextResponse.json({ success: false, error: 'memberIds must be an array of strings' }, { status: 400 });
    }

    const group = createGroup(
      { name: name.trim(), description: description?.trim(), teacherId: session.user.id, memberIds },
      session.user.id,
    );

    return NextResponse.json({ success: true, group });
  } catch (error) {
    logger.error('Error creating group:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});
