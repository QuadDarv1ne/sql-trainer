import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit, RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';

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
    const limitResult = await rateLimit(`web-vitals:${ip}`, { max: 60, windowMs: RATE_LIMIT_WINDOWS.oneMinute });
    if (!limitResult.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const metric: WebVitalMetric = await request.json();

    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid metric' }, { status: 400 });
    }

    const safePage = (metric.page || '').replace(/[\r\n]/g, '_');
    logger.info(`[WebVitals] ${metric.name}=${Math.round(metric.value)} (${metric.rating}) page=${safePage}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('WebVitals POST error', err);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
