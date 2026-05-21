import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { generateLearningPlan } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const plan = generateLearningPlan(userId);
    if (!plan) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('[LearningPlan] Error:', error);
    return NextResponse.json({ error: 'Failed to generate learning plan' }, { status: 500 });
  }
}
