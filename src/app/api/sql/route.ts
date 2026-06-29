import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';
import { executeMongoQuery } from '@/lib/mongodb-engine';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import type { MongoSchema } from '@/lib/mongodb-engine';
import { validateBody } from '@/lib/validation';

const sqlExecuteSchema = z.object({
  sql: z
    .string()
    .min(1, { message: 'SQL запрос не может быть пустым' })
    .max(10000, { message: 'Запрос слишком длинный' }),
  dbType: z.enum(['sqlite', 'postgresql', 'clickhouse', 'mongodb']).optional(),
  taskId: z.string().optional(),
});

const VALID_DB_TYPES = ['sqlite', 'postgresql', 'clickhouse', 'mongodb'] as const;

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
  const statementTypes = extractStatementTypes(sql);

  for (const stmt of statementTypes) {
    // Check against blocked prefixes first (more specific)
    for (const blocked of BLOCKED_PREFIXES) {
      if (stmt === blocked || stmt.startsWith(blocked + ' ')) {
        return `Запрос содержит заблокированные команды (${stmt}). В режиме обучения разрешены только SELECT, WITH, EXPLAIN, PRAGMA.`;
      }
    }

    // Check against allowed prefixes
    const isAllowed = ALLOWED_PREFIXES.some((allowed) => stmt === allowed || stmt.startsWith(allowed + ' '));

    if (!isAllowed && stmt.length > 0) {
      return `Неизвестная команда SQL (${stmt}). В режиме обучения разрешены только SELECT, WITH, EXPLAIN, PRAGMA.`;
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
    const clientId = getClientIdentifier(request, isAuthenticated ? session.user.id : undefined);
    const rateKey = `sql:${clientId}`;

    const maxQueries = isAuthenticated ? 60 : 30;
    const limitResult = await rateLimit(rateKey, { max: maxQueries, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много запросов. Подождите немного', columns: [], rows: [], executionTime: 0 },
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
          { success: false, error: 'Задание не поддерживает MongoDB', columns: [], rows: [], executionTime: 0 },
          { status: 400 },
        );
      }
      let schema: MongoSchema;
      try {
        schema = JSON.parse(task.schema) as MongoSchema;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Ошибка схемы данных задания', columns: [], rows: [], executionTime: 0 },
          { status: 500 },
        );
      }
      const result = executeMongoQuery(sql, schema);
      return NextResponse.json(result);
    }

    let result;

    if (taskId) {
      const task = getTaskById(taskId);
      result = task ? executeWithSchema(sql, task.schema, effectiveDbType) : executeQuery(sql, effectiveDbType);
    } else {
      result = executeQuery(sql, effectiveDbType);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    logger.error('SQL execute error:', err);
    return NextResponse.json(
      { success: false, error: 'Произошла внутренняя ошибка', columns: [], rows: [], executionTime: 0 },
      { status: 500 },
    );
  }
}
