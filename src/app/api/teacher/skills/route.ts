import { withTeacherAuth } from '@/lib/api-auth';
import { getStudentSkillBreakdown } from '@/lib/db-users';
import { NextResponse } from 'next/server';

export const GET = withTeacherAuth(() => {
  const breakdown = getStudentSkillBreakdown();
  return NextResponse.json({ breakdown });
});
