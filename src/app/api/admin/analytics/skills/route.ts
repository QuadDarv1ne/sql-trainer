import { NextResponse } from 'next/server';
import { getStudentSkillBreakdown } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const breakdown = getStudentSkillBreakdown();
  return NextResponse.json({ breakdown });
});
