import { NextResponse } from 'next/server';
import { getStudentDetail, getUserAchievements, getAchievementDetails } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

export const GET = withAdminAuth(async ({ params }) => {
  const id = params?.['id'];
  if (!id) {
    return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
  }
  const student = getStudentDetail(id);
  if (!student) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }
  const userAchievements = await getUserAchievements(id);
  const achievementDetails = await getAchievementDetails(userAchievements.map((a) => a.id));
  return NextResponse.json({
    student,
    achievements: achievementDetails.map((detail) => {
      const earned = userAchievements.find((a) => a.id === detail.id);
      return { ...detail, earned_at: earned?.earned_at || 0 };
    }),
  });
});
