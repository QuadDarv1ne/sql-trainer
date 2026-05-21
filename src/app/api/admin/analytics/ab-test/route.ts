import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getABTestComparison } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('testType') || 'learning_path';

    const comparison = getABTestComparison(testType);
    return NextResponse.json(comparison);
  } catch (error) {
    console.error('[ABTest] Error:', error);
    return NextResponse.json({ error: 'Failed to load A/B test comparison' }, { status: 500 });
  }
}
