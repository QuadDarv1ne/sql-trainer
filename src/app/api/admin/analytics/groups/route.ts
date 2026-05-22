import { NextResponse } from 'next/server';
import { getStudentGroupsAnalytics } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const groups = getStudentGroupsAnalytics();
  return NextResponse.json({ groups });
});
