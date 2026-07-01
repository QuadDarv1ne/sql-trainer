import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, TRAINING_TASKS } from '@/lib/training-tasks';
import { getSchemaInfo } from '@/lib/sql-engine';
import { rateLimit, getClientIdentifier, RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';

const initTrainingSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  dbType: z.enum(['sqlite', 'postgresql', 'clickhouse', 'mongodb']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 init requests per minute per client
    const clientId = getClientIdentifier(request);
    const limitResult = await rateLimit(`init-training:${clientId}`, { max: 20, windowMs: RATE_LIMIT_WINDOWS.oneMinute });
    if (!limitResult.success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please wait' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const validation = validateBody(body, initTrainingSchema);
    if ('response' in validation) return validation.response;

    const { taskId, dbType } = validation.data;

    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const effectiveDbType = dbType || task.dbType;

    // MongoDB doesn't use SQL schema - return empty schema info
    if (effectiveDbType === 'mongodb') {
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
        schema: { tables: [] },
      });
    }

    const schemaInfo = getSchemaInfo(task.schema, effectiveDbType as 'sqlite' | 'postgresql' | 'clickhouse');

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
    logger.error('SQL init-training POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Rate limit: 10 task list requests per minute per client
    const clientId = getClientIdentifier(request);
    const limitResult = await rateLimit(`init-training-list:${clientId}`, { max: 10, windowMs: RATE_LIMIT_WINDOWS.oneMinute });
    if (!limitResult.success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please wait' }, { status: 429 });
    }

    // Return all tasks (without schema to reduce payload)
    const tasksList = TRAINING_TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      dbType: t.dbType,
    }));

    return NextResponse.json({ success: true, tasks: tasksList });
  } catch (err: unknown) {
    logger.error('SQL init-training GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
