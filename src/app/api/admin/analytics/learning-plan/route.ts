import { NextResponse } from 'next/server';
import { generateLearningPlan } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ searchParams }) => {
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const plan = generateLearningPlan(userId);
  if (!plan) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }
  return NextResponse.json(plan);
});
