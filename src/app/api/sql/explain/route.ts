import { NextRequest, NextResponse } from 'next/server';
import { explainQuery } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

const MAX_SQL_LENGTH = 10000;
const VALID_DB_TYPES = ['sqlite', 'postgresql'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, dbType, taskId } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL запрос обязателен' },
        { status: 400 }
      );
    }

    if (sql.length > MAX_SQL_LENGTH) {
      return NextResponse.json(
        { success: false, error: 'Запрос слишком длинный' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId обязателен для EXPLAIN' },
        { status: 400 }
      );
    }

    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Задание не найдено' },
        { status: 404 }
      );
    }

    const effectiveDbType = VALID_DB_TYPES.includes(dbType as typeof VALID_DB_TYPES[number]) ? dbType : 'sqlite';
    const result = explainQuery(sql, task.schema, effectiveDbType);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
