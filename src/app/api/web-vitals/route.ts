import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

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
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limitResult = await rateLimit(`web-vitals:${ip}`, { max: 60, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

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
