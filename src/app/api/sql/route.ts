import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';
import { rateLimit } from '@/lib/rate-limit';
import { executeMongoQuery } from '@/lib/mongodb-engine';
import { apiServerError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import type { MongoSchema } from '@/lib/mongodb-engine';
import { validateBody } from '@/lib/validation';
import { sqlExecuteSchema, VALID_DB_TYPES } from '@/lib/sql-schema';
import { recordQuery, recordError } from '@/lib/db-monitor';

/**
 * Extract client IP from request using x-forwarded-for header for proxy reliability.
 * Returns 'unknown' if header is not present.
 */
function getIpFromRequest(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

/**
 * Allowed SQL statement prefixes for training mode.
 * Only these statement types are permitted.
 */
const ALLOWED_PREFIXES = ['SELECT', 'WITH', 'EXPLAIN', 'PRAGMA', 'SHOW', 'DESCRIBE', 'DESC'] as const;

/**
 * Blocked SQL statement prefixes - DDL and DML that could be destructive.
 */
const BLOCKED_PREFIXES = [
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
function extractStatementTypes(sql: string): string[] {
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
 */
function validateTrainingSql(sql: string): string | null {
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

export async function POST(request: NextRequest) {
  try {
    // Authenticate and apply rate limiting
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    // Rate limit: 30/min for anonymous, 60/min for authenticated
    const rateKey = isAuthenticated ? `sql:user:${session.user.id}` : `sql:ip:${getIpFromRequest(request)}`;

    const maxQueries = isAuthenticated ? 60 : 30;
    const limitResult = await rateLimit(rateKey, { max: maxQueries, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait', columns: [], rows: [], executionTime: 0 },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = validateBody(body, sqlExecuteSchema);
    if ('response' in parsed) return parsed.response;

    const { sql, dbType, taskId } = parsed.data;

    // Validate SQL safety in ALL modes (blocked patterns apply universally)
    const blockReason = validateTrainingSql(sql);
    if (blockReason) {
      return NextResponse.json(
        { success: false, error: blockReason, columns: [], rows: [], executionTime: 0 },
        { status: 403 },
      );
    }

    const effectiveDbType = VALID_DB_TYPES.includes(dbType as (typeof VALID_DB_TYPES)[number]) ? dbType : 'sqlite';

    // MongoDB uses its own engine — only for MongoDB tasks
    if (effectiveDbType === 'mongodb') {
      const task = taskId ? getTaskById(taskId) : null;
      if (!task || task.dbType !== 'mongodb') {
        return NextResponse.json(
          { success: false, error: 'Task does not support MongoDB', columns: [], rows: [], executionTime: 0 },
          { status: 400 },
        );
      }
      let schema: MongoSchema;
      try {
        schema = JSON.parse(task.schema) as MongoSchema;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Task schema error', columns: [], rows: [], executionTime: 0 },
          { status: 500 },
        );
      }
      const result = executeMongoQuery(sql, schema);
      return NextResponse.json(result);
    }

    let result;

    const start = performance.now();
    if (taskId) {
      const task = getTaskById(taskId);
      result = task ? executeWithSchema(sql, task.schema, effectiveDbType) : executeQuery(sql, effectiveDbType);
    } else {
      result = executeQuery(sql, effectiveDbType);
    }
    const elapsed = performance.now() - start;

    // Record query metrics for monitoring
    recordQuery(elapsed, sql);

    if (elapsed > 1000) {
      const sqlPreview = sql.length > 100 ? sql.slice(0, 100) + '...' : sql;
      logger.warn(`Slow query (${Math.round(elapsed)}ms): ${sqlPreview}`);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    recordError();
    return apiServerError('SQL execute', undefined, err);
  }
}
