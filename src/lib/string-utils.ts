/**
 * Convert a kebab-case or snake_case string to Title Case.
 * Replaces hyphens and underscores with spaces, then capitalises each word.
 */
export function toTitleCase(s: string): string {
  return s
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
