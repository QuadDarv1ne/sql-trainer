import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/api-auth';
import { getMasteryProgression } from '@/lib/db-users';

export async function GET() {
  try {
    const { error } = await requireTeacher();
    if (error) return error;

    const progression = getMasteryProgression();
    return NextResponse.json({ progression });
  } catch (error) {
    console.error('[API Error] GET /api/teacher/mastery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
