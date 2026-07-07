import { withTeacherAuth } from '@/lib/api-auth';
import { getMasteryProgression } from '@/lib/db-users';
import { NextResponse } from 'next/server';

export const GET = withTeacherAuth(() => {
  const progression = getMasteryProgression();
  return NextResponse.json({ success: true, progression });
});
