import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getAllGroupsForAdmin, getGroupById, deleteGroup } from '@/lib/db-users';

export const GET = withAdminAuth(async () => {
  const groups = getAllGroupsForAdmin();
  return NextResponse.json({ success: true, groups });
});

export const DELETE = withAdminAuth(async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
  }

  const group = getGroupById(id);
  if (!group) {
    return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
  }

  deleteGroup(id);
  return NextResponse.json({ success: true });
});
