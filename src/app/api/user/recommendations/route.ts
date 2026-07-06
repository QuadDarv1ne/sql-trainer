import { withUserAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getStudentRecommendations } from '@/lib/db-users';

export const GET = withUserAuth(async ({ session }) => {
  const recommendations = getStudentRecommendations(session.user.id);
  return NextResponse.json({ success: true, recommendations });
});
