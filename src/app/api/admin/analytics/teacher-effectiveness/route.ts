import { NextResponse } from 'next/server';
import { getTeacherEffectiveness } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const data = getTeacherEffectiveness();
  return NextResponse.json(data);
});
