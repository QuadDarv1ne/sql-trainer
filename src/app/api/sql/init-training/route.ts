import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, TRAINING_TASKS } from '@/lib/training-tasks';
import { getSchemaInfo } from '@/lib/sql-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, dbType } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId обязателен' },
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

    const effectiveDbType = dbType || task.dbType;
    const schemaInfo = getSchemaInfo(task.schema, effectiveDbType);

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        difficulty: task.difficulty,
        taskText: task.taskText,
        hint: task.hint,
        schema: task.schema,
      },
      schema: schemaInfo,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return all tasks (without schema to reduce payload)
  const tasksList = TRAINING_TASKS.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    difficulty: t.difficulty,
    dbType: t.dbType,
  }));

  return NextResponse.json({ success: true, tasks: tasksList });
}
