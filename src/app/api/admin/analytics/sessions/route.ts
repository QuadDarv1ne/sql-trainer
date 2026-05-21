import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getSessionAnalysis } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const sessions = getSessionAnalysis();

  return Response.json({ sessions });
}
