import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getTeacherStudentProgress } from '@/lib/db-users';

export const GET = withTeacherAuth(async () => {
  const students = getTeacherStudentProgress();
  return NextResponse.json({ success: true, students });
});
