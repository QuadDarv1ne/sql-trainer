import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserAchievements, checkAndAwardAchievements } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const checkNew = searchParams.get('check') === 'true';

  if (checkNew) {
    const newAchievements = await checkAndAwardAchievements(session.user.id);
    return NextResponse.json({ success: true, newAchievements });
  }

  const achievements = await getUserAchievements(session.user.id);
  return NextResponse.json({ success: true, achievements });
}
