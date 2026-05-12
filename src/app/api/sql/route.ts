import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeWithSchema, getSchemaInfo } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

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

    const effectiveDbType = dbType || 'sqlite';

    let result;

    // If a taskId is provided, execute with the task's schema
    if (taskId) {
      const task = getTaskById(taskId);
      if (task) {
        result = executeWithSchema(sql, task.schema, effectiveDbType);
      } else {
        result = executeQuery(sql, effectiveDbType);
      }
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
