import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getTimeToCompleteEstimates } from '@/lib/db-users';

export const GET = withTeacherAuth(async () => {
  const data = getTimeToCompleteEstimates();
  return NextResponse.json({ success: true, data });
});
