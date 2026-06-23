import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
  page: string;
}

export async function POST(request: Request) {
  try {
    const metric: WebVitalMetric = await request.json();

    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    logger.info(`[WebVitals] ${metric.name}=${Math.round(metric.value)} (${metric.rating}) page=${metric.page}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
