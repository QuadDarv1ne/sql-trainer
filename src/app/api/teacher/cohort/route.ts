import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getCohortAnalysis } from '@/lib/db-users';

export const GET = withTeacherAuth(async () => {
  const data = getCohortAnalysis();
  return NextResponse.json({ data });
});
