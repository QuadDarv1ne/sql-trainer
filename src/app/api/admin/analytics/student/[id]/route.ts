import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getStudentDetail, getUserAchievements, getAchievementDetails } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const student = getStudentDetail(id);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const userAchievements = await getUserAchievements(id);
    const achievementDetails = await getAchievementDetails(
      userAchievements.map(a => a.id)
    );

    return NextResponse.json({
      student,
      achievements: achievementDetails.map(detail => {
        const earned = userAchievements.find(a => a.id === detail.id);
        return {
          ...detail,
          earned_at: earned?.earned_at || 0,
        };
      }),
    });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/student/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
