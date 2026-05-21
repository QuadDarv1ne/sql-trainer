import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getSkillGapAnalysis } from '@/lib/db-users';
import { getCached, setCached, STANDARD_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async () => {
  const cached = getCached('/api/admin/analytics/skill-gap');
  if (cached) return NextResponse.json(cached);

  const data = getSkillGapAnalysis();
  const result = { skillGapData: data };
  setCached('/api/admin/analytics/skill-gap', {}, result, STANDARD_TTL);
  return NextResponse.json(result);
});
