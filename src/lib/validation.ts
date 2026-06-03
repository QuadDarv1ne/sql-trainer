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
    return {
      response: NextResponse.json({ success: false, error: firstError }, { status: 400 }),
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

/**
 * Create a higher-order function that wraps a route handler with Zod validation.
 * Usage:
 *   export const POST = withValidation(sqlVerifySchema, async (req, data) => { ... });
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (req: Request, data: z.infer<T>) => Promise<NextResponse>,
) {
  return async (req: Request): Promise<NextResponse> => {
    const validation = await parseAndValidate(req, schema);

    if ('response' in validation) {
      return validation.response;
    }

    return handler(req, validation.data);
  };
}
