/**
 * Validation middleware for API routes using Zod schemas.
 */
import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Validate request body against a Zod schema.
 * Returns parsed data or a NextResponse with error.
 */
export function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T
): { data: z.infer<T> } | { response: NextResponse } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? 'Неверный формат данных';
    return {
      response: NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

/**
 * Create a higher-order function that wraps a route handler with Zod validation.
 * Usage:
 *   export const POST = withValidation(sqlVerifySchema, async (req, data) => { ... });
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (req: Request, data: z.infer<T>) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      const body = await req.json();
      const validation = validateBody(body, schema);

      if ('response' in validation) {
        return validation.response;
      }

      return handler(req, validation.data);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Неверный формат запроса' },
        { status: 400 }
      );
    }
  };
}
