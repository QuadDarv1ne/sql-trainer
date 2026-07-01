/**
 * SQL safety validation for training mode.
 * Shared between execute and explain routes to prevent DDL/DML injection.
 */

/**
 * Allowed SQL statement prefixes for training mode.
 * Only these statement types are permitted.
 */
export const ALLOWED_PREFIXES = ['SELECT', 'WITH', 'EXPLAIN', 'PRAGMA', 'SHOW', 'DESCRIBE', 'DESC'] as const;

/**
 * Blocked SQL statement prefixes - DDL and DML that could be destructive.
 */
export const BLOCKED_PREFIXES = [
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'RENAME',
  'ATTACH',
  'DETACH',
  'LOAD',
  'INSERT',
  'UPDATE',
  'DELETE',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'PRAGMA writable_schema',
] as const;

/**
 * Tokenize SQL to extract statement types, handling comments and strings.
 * This prevents bypassing filters via comment injection.
 */
export function extractStatementTypes(sql: string): string[] {
  const statements: string[] = [];
  let i = 0;
  const upper = sql.toUpperCase();

  while (i < upper.length) {
    // Skip block comments
    if (upper.startsWith('/*', i)) {
      const end = upper.indexOf('*/', i + 2);
      i = end === -1 ? upper.length : end + 2;
      continue;
    }

    // Skip line comments
    if (upper.startsWith('--', i)) {
      const end = upper.indexOf('\n', i);
      i = end === -1 ? upper.length : end + 1;
      continue;
    }

    // Skip string literals
    if (upper[i] === "'" || upper[i] === '"') {
      const quote = upper[i];
      i++;
      while (i < upper.length) {
        // SQL uses '' for escaped quotes, not \'
        if (upper[i] === quote && i + 1 < upper.length && upper[i + 1] === quote) {
          i += 2; // Skip escaped quote
          continue;
        }
        if (upper[i] === quote) break;
        i++;
      }
      i++;
      continue;
    }

    // Read a word
    if (/\s/.test(upper[i])) {
      i++;
      continue;
    }

    let word = '';
    while (i < upper.length && /[A-Z0-9_.]/.test(upper[i])) {
      word += upper[i];
      i++;
    }

    if (word) {
      // Check if it's a known statement type
      const firstWord = word.split('.')[0];
      statements.push(firstWord);
    }
  }

  return statements;
}

/**
 * Validate SQL for safety in training mode.
 * Uses tokenization to prevent comment injection bypass.
 * Returns null if valid, or an error message string if blocked.
 */
export function validateTrainingSql(sql: string): string | null {
  // Check length limit
  if (sql.length > 10000) {
    return 'SQL query too long (max 10000 characters)';
  }

  const statementTypes = extractStatementTypes(sql);

  for (const stmt of statementTypes) {
    // Check against blocked prefixes first (more specific)
    for (const blocked of BLOCKED_PREFIXES) {
      if (stmt === blocked || stmt.startsWith(blocked + ' ')) {
        return `Request contains blocked commands (${stmt}). In learning mode, only SELECT, WITH, EXPLAIN, PRAGMA are allowed.`;
      }
    }

    // Check against allowed prefixes
    const isAllowed = ALLOWED_PREFIXES.some((allowed) => stmt === allowed || stmt.startsWith(allowed + ' '));

    if (!isAllowed && stmt.length > 0) {
      return `Unknown SQL command (${stmt}). In learning mode, only SELECT, WITH, EXPLAIN, PRAGMA are allowed.`;
    }
  }

  return null;
}
