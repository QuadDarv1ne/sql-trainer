import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getTeacherEffectiveness } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const data = getTeacherEffectiveness();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[TeacherEffectiveness] Error:', error);
    return NextResponse.json({ error: 'Failed to load teacher effectiveness' }, { status: 500 });
  }
}
