import { handlers as nextAuthHandlers } from '@/lib/auth-internal';
import type { NextRequest } from 'next/server';
import type { NextHandler } from 'next-auth';

export async function GET(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params;
  return (nextAuthHandlers.GET as NextHandler)(request, { params });
}

export async function POST(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params;
  return (nextAuthHandlers.POST as NextHandler)(request, { params });
}
