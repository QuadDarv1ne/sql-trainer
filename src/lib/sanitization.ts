/**
 * Input sanitization helpers for user-supplied data.
 * Complements Zod validation by stripping dangerous characters and encoding.
 */

/** Strip HTML tags and null bytes from a string */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/\0/g, '') // remove null bytes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove control chars
    .trim();
}

/** Validate and sanitize a display name (1-100 chars, alphanumeric + spaces + common punctuation) */
export function sanitizeName(input: string): { value: string; error?: string } {
  const cleaned = sanitizeString(input);
  if (cleaned.length === 0 || cleaned.length > 100) {
    return { value: '', error: 'Name must be 1-100 characters' };
  }
  // Allow letters, numbers, spaces, hyphens, apostrophes, dots, and common unicode letters
  if (!/^[\p{L}\p{N}\s\-.']{1,100}$/u.test(cleaned)) {
    return { value: '', error: 'Name contains invalid characters' };
  }
  return { value: cleaned };
}

/** Validate and sanitize a phone number (digits, +, -, spaces, parentheses) */
export function sanitizePhone(input: string): { value: string; error?: string } {
  if (!input || input.trim().length === 0) {
    return { value: '' }; // empty is OK for optional phone
  }
  const cleaned = sanitizeString(input);
  if (cleaned.length > 20) {
    return { value: '', error: 'Phone must be 20 characters or fewer' };
  }
  if (!/^[+\d\s()-]+$/.test(cleaned)) {
    return { value: '', error: 'Phone contains invalid characters' };
  }
  return { value: cleaned };
}
