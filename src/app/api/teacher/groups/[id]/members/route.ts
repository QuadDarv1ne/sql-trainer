import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getGroupById,
  addGroupMembers,
  removeGroupMember,
  getGroupMembers,
} from '@/lib/db-users';

export const POST = withTeacherAuth(async ({ session, request }) => {
  try {
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

    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: 'userIds array is required' }, { status: 400 });
    }

    const added = addGroupMembers(groupId, userIds, session.user.id);
    const members = getGroupMembers(groupId);

    return NextResponse.json({ success: true, added, members });
  } catch (error) {
    logger.error('Error adding group members:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withTeacherAuth(async ({ session, request }) => {
  try {
    const url = new URL(request.url);
    const groupId = url.pathname.split('/')[5];
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
