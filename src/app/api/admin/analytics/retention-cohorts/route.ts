import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getRetentionCohorts } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const data = getRetentionCohorts();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[RetentionCohorts] Error:', error);
    return NextResponse.json({ error: 'Failed to load retention cohorts' }, { status: 500 });
  }
}
