import { withTeacherAuth } from '@/lib/api-auth';
import { getStudentGrowthTrends } from '@/lib/db-users';
import { NextResponse } from 'next/server';

export const GET = withTeacherAuth(() => {
  const growth = getStudentGrowthTrends(12);
  return NextResponse.json({ success: true, growth });
});
