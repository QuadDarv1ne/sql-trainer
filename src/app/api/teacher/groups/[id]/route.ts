import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMembers,
} from '@/lib/db-users';

export const GET = withTeacherAuth(async ({ session, request }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
    }

    const group = getGroupById(id);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    if (group.teacher_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const members = getGroupMembers(id);
    return NextResponse.json({ success: true, group: { ...group, members } });
  } catch (error) {
    logger.error('Error fetching group:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

export const PATCH = withTeacherAuth(async ({ session, request }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
    }

    const existing = getGroupById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    if (existing.teacher_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const group = updateGroup(id, {
      name: body.name?.trim(),
      description: body.description?.trim(),
    }, session.user.id);

    return NextResponse.json({ success: true, group });
  } catch (error) {
    logger.error('Error updating group:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withTeacherAuth(async ({ session, request }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
    }

    const existing = getGroupById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    if (existing.teacher_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    deleteGroup(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting group:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});
