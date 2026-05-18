/**
 * Split SQL string into alternating non-string and string segments.
 * Even indices (0, 2, ...) are non-string SQL.
 * Odd indices (1, 3, ...) are string literals (preserved as-is).
 *
 * This allows SQL formatting to operate on keywords/structure
 * without corrupting string literals.
 */
export function splitSqlSegments(input: string): string[] {
  const segments: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    if (inSingleQuote) {
      current += ch;
      if (ch === "'" && next !== "'") {
        inSingleQuote = false;
      } else if (ch === "'" && next === "'") {
        current += next;
        i++;
      }
    } else if (inDoubleQuote) {
      current += ch;
      if (ch === '"' && next !== '"') {
        inDoubleQuote = false;
      } else if (ch === '"' && next === '"') {
        current += next;
        i++;
      }
    } else {
      if (ch === "'") {
        segments.push(current);
        current = ch;
        inSingleQuote = true;
      } else if (ch === '"') {
        segments.push(current);
        current = ch;
        inDoubleQuote = true;
      } else {
        current += ch;
      }
    }
    i++;
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}
