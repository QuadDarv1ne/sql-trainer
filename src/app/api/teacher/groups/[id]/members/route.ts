import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getGroupById, addGroupMembers, removeGroupMember, getGroupMembers } from '@/lib/db-users';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';

const addMembersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'userIds array is required'),
});

export const POST = withTeacherAuth(async ({ session, request, params }) => {
  try {
    const groupId = params?.id;

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

    const body = await request.json();
    const parsed = validateBody(body, addMembersSchema);
    if ('response' in parsed) return parsed.response;

    const added = addGroupMembers(groupId, parsed.data.userIds, session.user.id);
    const members = getGroupMembers(groupId);

    return NextResponse.json({ success: true, added, members });
  } catch (error) {
    logger.error('Error adding group members:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withTeacherAuth(async ({ session, request, params }) => {
  try {
    const url = new URL(request.url);
    const groupId = params?.id;
    const userId = url.searchParams.get('userId');

    if (!groupId || !userId) {
      return NextResponse.json({ success: false, error: 'Group ID and userId are required' }, { status: 400 });
    }

    const group = getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    if (group.teacher_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    removeGroupMember(groupId, userId, session.user.id);
    const members = getGroupMembers(groupId);

    return NextResponse.json({ success: true, members });
  } catch (error) {
    logger.error('Error removing group member:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});
