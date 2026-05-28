import { NextResponse } from 'next/server';
import { withUserAuth } from '@/lib/api-auth';
import { getUserAchievements, checkAndAwardAchievements, getAchievementDetails } from '@/lib/db-users';

export const GET = withUserAuth(async ({ request, session }) => {
  const { searchParams } = new URL(request.url);
  const checkNew = searchParams.get('check') === 'true';

  if (checkNew) {
    const newAchievementIds = await checkAndAwardAchievements(session.user.id);
    if (newAchievementIds.length === 0) {
      return NextResponse.json({ success: true, newAchievements: [] });
    }
    const details = await getAchievementDetails(newAchievementIds);
    return NextResponse.json({ success: true, newAchievements: details });
  }

  const achievements = await getUserAchievements(session.user.id);
  return NextResponse.json({ success: true, achievements });
});
