import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserAchievements, checkAndAwardAchievements, getAchievementDetails } from '@/lib/db-users';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
    }

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
  } catch (error) {
    logger.error('GET /api/user/achievements:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
