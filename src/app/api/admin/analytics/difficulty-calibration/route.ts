import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getDifficultyCalibration } from '@/lib/db-users';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const report = getDifficultyCalibration();
    return NextResponse.json(report);
  } catch (error) {
    console.error('[DifficultyCalibration] Error:', error);
    return NextResponse.json({ error: 'Failed to load difficulty calibration' }, { status: 500 });
  }
}
