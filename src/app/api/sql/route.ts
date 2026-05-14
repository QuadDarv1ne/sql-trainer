import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

const MAX_SQL_LENGTH = 10000;
const VALID_DB_TYPES = ['sqlite', 'postgresql'] as const;

export async function POST(request: NextRequest) {
  try {
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg, columns: [], rows: [], executionTime: 0 },
      { status: 500 }
    );
  }
}
