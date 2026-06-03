import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getDb, isStudentInTeacherGroup } from '@/lib/db-users';

export const GET = withTeacherAuth(async ({ session, params }) => {
  const id = params?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  // Verify that the student belongs to one of the teacher's groups
  const teacherId = session.user.id;
  if (!isStudentInTeacherGroup(id, teacherId)) {
    return NextResponse.json({ error: 'Access denied: student not in your groups' }, { status: 403 });
  }

  const db = getDb();
  const activity = db
    .prepare(
      `
    SELECT
      DATE(completed_at / 86400000 * 86400000) as date,
      COUNT(*) as completions
    FROM user_progress
    WHERE user_id = ?
    GROUP BY date
    ORDER BY date ASC
    LIMIT 30
  `,
    )
    .all(id) as Array<{ date: string; completions: number }>;

  return NextResponse.json({ activity });
});
