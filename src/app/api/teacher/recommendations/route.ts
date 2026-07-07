import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/db-users';

export const GET = withTeacherAuth(async () => {
  const data = generateRecommendations();
  return NextResponse.json({ success: true, data });
});
