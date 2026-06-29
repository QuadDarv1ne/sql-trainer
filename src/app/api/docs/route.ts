import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
