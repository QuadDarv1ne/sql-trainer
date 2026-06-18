import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getGroupsByTeacherId, createGroup } from '@/lib/db-users';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  memberIds: z.array(z.string()).optional(),
});

export const GET = withTeacherAuth(async ({ session }) => {
  const groups = getGroupsByTeacherId(session.user.id);
  return NextResponse.json({ success: true, groups });
});

export const POST = withTeacherAuth(async ({ session, request }) => {
  try {
    const body = await request.json();
    const parsed = validateBody(body, createGroupSchema);
    if ('response' in parsed) return parsed.response;

    const { name, description, memberIds } = parsed.data;

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
