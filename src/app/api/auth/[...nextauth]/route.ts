import { rateLimit } from '@/lib/rate-limit';
import { GET, POST as nextAuthPost } from '@/lib/auth-internal';
import { NextResponse, type NextRequest } from 'next/server';

async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

  const limitResult = await rateLimit(`login:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limitResult.limit),
          'X-RateLimit-Remaining': String(limitResult.remaining),
          'X-RateLimit-Reset': String(Math.ceil(limitResult.resetAt / 1000)),
          'Retry-After': String(limitResult.retryAfter),
        },
      },
    );
  }

  const response = await nextAuthPost(request as NextRequest);
  response.headers.set('X-RateLimit-Limit', String(limitResult.limit));
  response.headers.set('X-RateLimit-Remaining', String(limitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(limitResult.resetAt / 1000)));
  return response;
}

export { GET, POST };
