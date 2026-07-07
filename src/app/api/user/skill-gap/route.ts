import { withUserAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getStudentSkillGap } from '@/lib/db-users';

export const GET = withUserAuth(async ({ session }) => {
  const skillGaps = getStudentSkillGap(session.user.id);
  return NextResponse.json({ success: true, skills: skillGaps });
});
