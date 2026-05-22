import { NextResponse } from 'next/server';
import { getStudentLearningTimeline } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const GET = withAdminAuth(async ({ params }) => {
  const id = params?.['id'];
  if (!id) {
    return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
  }
  const data = getStudentLearningTimeline(id);
  if (!data.student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }
  return NextResponse.json(data);
});
