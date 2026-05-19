import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getSessionAnalysis } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.success) return admin.response;

  const sessions = getSessionAnalysis();

  return Response.json({ sessions });
}
