import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getTopicMastery } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const data = getTopicMastery();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[TopicMastery] Error:', error);
    return NextResponse.json({ error: 'Failed to load topic mastery' }, { status: 500 });
  }
}
