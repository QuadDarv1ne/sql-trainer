/**
 * Deep sanitization for API request bodies.
 * Recursively walks objects and strips dangerous characters from string values.
 *
 * Usage in API routes:
 *   const safe = deepSanitize(await req.json());
 */
import { sanitizeString } from './sanitization';

const MAX_DEPTH = 10;
const MAX_STRING_LENGTH = 10_000;

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const cleaned = sanitizeString(value);
    return cleaned.length > MAX_STRING_LENGTH ? cleaned.slice(0, MAX_STRING_LENGTH) : cleaned;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const cleanKey = sanitizeString(key);
      if (cleanKey) {
        result[cleanKey] = sanitizeValue(val, depth + 1);
      }
    }
    return result;
  }
  return value;
}

/**
 * Recursively sanitize all string values in a request body.
 * Preserves numbers, booleans, null, arrays, and nested objects.
 * Strips HTML tags, null bytes, and control characters from strings.
 */
export function deepSanitize<T>(input: T): T {
  return sanitizeValue(input, 0) as T;
}
