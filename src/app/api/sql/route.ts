import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { executeMongoQuery } from '@/lib/mongodb-engine';
import { apiServerError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import type { MongoSchema } from '@/lib/mongodb-engine';
import { validateBody } from '@/lib/validation';
import { sqlExecuteSchema, VALID_DB_TYPES } from '@/lib/sql-schema';
import { recordQuery, recordError } from '@/lib/db-monitor';
import { validateTrainingSql } from '@/lib/sql-safety';

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
        { success: false, error: 'Too many requests. Please wait', columns: [], rows: [], executionTime: 0 },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', columns: [], rows: [], executionTime: 0 },
        { status: 400 },
      );
    }
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
