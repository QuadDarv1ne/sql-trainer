import { NextRequest, NextResponse } from 'next/server';
import { explainQuery } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

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

    const effectiveDbType = dbType || 'sqlite';

    // If a taskId is provided, use the task's schema
    if (taskId) {
      const task = getTaskById(taskId);
      if (task) {
        const result = explainQuery(sql, task.schema, effectiveDbType);
        return NextResponse.json(result);
      }
    }

    return NextResponse.json(
      { success: false, error: 'taskId обязателен для EXPLAIN' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
