import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getStudentGrowthTrends } from '@/lib/db-users';

export async function GET() {
  const auth = requireTeacher();
  if (auth instanceof NextResponse) return auth;

  try {
    const growth = getStudentGrowthTrends(12);
    return NextResponse.json({ growth });
  } catch (error) {
    console.error('[Teacher GrowthTrends] Error:', error);
    return NextResponse.json({ error: 'Failed to load growth trends' }, { status: 500 });
  }
}
