import { withTeacherAuth } from '@/lib/api-auth';
import { getTaskCompletionFunnel } from '@/lib/db-users';
import { NextResponse } from 'next/server';

export const GET = withTeacherAuth(() => {
  const funnel = getTaskCompletionFunnel();
  return NextResponse.json({ success: true, funnel });
});
