/**
 * Validation middleware for API routes using Zod schemas.
 */
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { t } from '@/lib/i18n';

/**
 * Validate request body against a Zod schema.
 * Returns parsed data or a NextResponse with error.
 */
export function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T,
): { data: z.infer<T> } | { response: NextResponse } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? t('export.error.invalidFormat');
    // Sanitize error to prevent leaking internal field names
    const safeError = firstError.replace(/[\n\r]/g, '').slice(0, 200);
    return {
      response: NextResponse.json({ success: false, error: safeError }, { status: 400 }),
    };
  }

  return { data: result.data };
}

/**
 * Parse JSON from request and validate against a Zod schema in one step.
 * Handles JSON parse errors internally.
 *
 * Usage:
 *   const result = await parseAndValidate(req, schema);
 *   if ('response' in result) return result.response;
 *   const { sql, taskId } = result.data;
 */
export async function parseAndValidate<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: NextResponse.json({ success: false, error: t('validation.invalidRequest') }, { status: 400 }),
    };
  }

  return validateBody(body, schema);
}
