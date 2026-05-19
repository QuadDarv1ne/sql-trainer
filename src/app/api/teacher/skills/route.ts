import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getStudentSkillBreakdown } from '@/lib/db-users';

export async function GET() {
  try {
    const { error } = await requireTeacher();
    if (error) return error;

    const breakdown = getStudentSkillBreakdown();
    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('[API Error] GET /api/teacher/skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
