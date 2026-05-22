import { NextResponse } from 'next/server';
import { getDifficultyCalibration } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(() => {
  const report = getDifficultyCalibration();
  return NextResponse.json(report);
});
