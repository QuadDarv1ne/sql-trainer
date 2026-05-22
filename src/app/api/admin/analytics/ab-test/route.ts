import { NextResponse } from 'next/server';
import { getABTestComparison } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ searchParams }) => {
  const testType = searchParams.get('testType') || 'learning_path';
  const comparison = getABTestComparison(testType);
  return NextResponse.json(comparison);
});
