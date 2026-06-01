/**
 * String manipulation utilities.
 */

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

/**
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * Returns the same array reference for chaining.
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
