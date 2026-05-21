import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getStudentGradeDistribution } from '@/lib/db-users';

export async function GET() {
  const authResult = await requireTeacher();
  if (authResult.error) return authResult.error;

  try {
    const distribution = getStudentGradeDistribution();
    return NextResponse.json({ distribution });
  } catch (error) {
    console.error('[Teacher GradeDistribution] Error:', error);
    return NextResponse.json({ error: 'Failed to load grade distribution' }, { status: 500 });
  }
}
