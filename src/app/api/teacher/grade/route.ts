import { withTeacherAuth } from '@/lib/api-auth';
import { getStudentGradeDistribution } from '@/lib/db-users';
import { NextResponse } from 'next/server';

export const GET = withTeacherAuth(() => {
  const distribution = getStudentGradeDistribution();
  return NextResponse.json({ success: true, distribution });
});
