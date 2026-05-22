import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';
import { rateLimit } from '@/lib/rate-limit';

const MAX_SQL_LENGTH = 10000;
const VALID_DB_TYPES = ['sqlite', 'postgresql', 'clickhouse'] as const;

/**
 * Blocked SQL patterns for training mode.
 * These prevent destructive operations while allowing legitimate training queries.
 */
const BLOCKED_PATTERNS = [
  // Destructive operations
  /\bDROP\s+(TABLE|INDEX|VIEW|TRIGGER)\b/i,
  /\bDELETE\s+FROM\s+sqlite_/i,
  /\bALTER\s+TABLE\s+sqlite_/i,
  /\bATTACH\b/i,
  /\bDETACH\b/i,
  // System table modifications
  /\bINSERT\s+INTO\s+sqlite_/i,
  /\bUPDATE\s+sqlite_/i,
  // Shell/exec commands (SQLite)
  /\b\.shell\b/i,
  /\b\.system\b/i,
  // Load extension (potential security risk)
  /\bLOAD_EXTENSION\b/i,
];

/**
 * Validate SQL for safety in training mode.
 * Returns an error message if blocked, or null if safe.
 */
function validateTrainingSql(sql: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sql)) {
      return 'Запрос содержит заблокированные команды. В режиме обучения разрешены только SELECT, INSERT, UPDATE, DELETE для пользовательских таблиц.';
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 queries/min for anonymous, 60 for authenticated
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const limitResult = rateLimit(`sql:${ip}`, { max: 30, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много запросов. Подождите немного', columns: [], rows: [], executionTime: 0 },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { sql, dbType, taskId } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL запрос обязателен', columns: [], rows: [], executionTime: 0 },
        { status: 400 }
      );
    }

    if (sql.length > MAX_SQL_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Запрос слишком длинный (макс. ${MAX_SQL_LENGTH} символов)`, columns: [], rows: [], executionTime: 0 },
        { status: 400 }
      );
    }

    // Validate SQL safety in ALL modes (blocked patterns apply universally)
    const blockReason = validateTrainingSql(sql);
    if (blockReason) {
      return NextResponse.json(
        { success: false, error: blockReason, columns: [], rows: [], executionTime: 0 },
        { status: 403 }
      );
    }

    const effectiveDbType = VALID_DB_TYPES.includes(dbType as typeof VALID_DB_TYPES[number]) ? dbType : 'sqlite';

    let result;

    if (taskId) {
      const task = getTaskById(taskId);
      result = task
        ? executeWithSchema(sql, task.schema, effectiveDbType)
        : executeQuery(sql, effectiveDbType);
    } else {
      result = executeQuery(sql, effectiveDbType);
    }

    return NextResponse.json(result);
  } catch (_err: unknown) {
    return NextResponse.json(
      { success: false, error: 'Произошла внутренняя ошибка', columns: [], rows: [], executionTime: 0 },
      { status: 500 }
    );
  }
}
