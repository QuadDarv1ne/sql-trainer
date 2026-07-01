import { NextResponse } from 'next/server';
import { getStudentStreak } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const GET = withAdminAuth(async ({ params }) => {
  const id = params?.['id'];
  if (!id) {
    return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
  }
  const streak = getStudentStreak(id);
  return NextResponse.json({ streak });
});
