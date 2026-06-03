import { NextRequest, NextResponse } from 'next/server';
import { executeWithSchema, executeWithSchemaMulti, splitStatements } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';
import { rateLimit } from '@/lib/rate-limit';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';
import { executeMongoQuery } from '@/lib/mongodb-engine';
import { logger } from '@/lib/logger';
import type { MongoSchema } from '@/lib/mongodb-engine';

const sqlVerifySchema = z.object({
  sql: z
    .string()
    .min(1, { message: 'SQL запрос не может быть пустым' })
    .max(10000, { message: 'Запрос слишком длинный' }),
  taskId: z.string().min(1, { message: 'taskId обязателен' }),
  dbType: z.string().optional(),
});

function normalizeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'bigint') return val.toString();
  if (typeof val === 'number') {
    if (Number.isNaN(val)) return 'NaN';
    if (!Number.isFinite(val)) return String(val);
    return Number(val.toPrecision(10)).toString();
  }
  return String(val).trim().toLowerCase();
}

function normalizeRow(row: Record<string, unknown>, columns: string[]): string {
  const sortedCols = [...columns].sort((a, b) => a.localeCompare(b));
  return sortedCols.map((col) => normalizeValue(row[col])).join('|');
}

/**
 * Extract the last SELECT statement from a multi-statement SQL string.
 */
function extractLastSelect(sql: string): string {
  const statements = splitStatements(sql);
  for (let i = statements.length - 1; i >= 0; i--) {
    const trimmed = statements[i].toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      return statements[i];
    }
  }
  return statements[statements.length - 1] || sql;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 verification attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const limitResult = await rateLimit(`verify:${ip}`, { max: 20, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Слишком много попыток. Попробуйте позже' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = validateBody(body, sqlVerifySchema);
    if ('response' in parsed) return parsed.response;

    const { sql, taskId, dbType } = parsed.data;

    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
        { status: 404 },
      );
    }

    const effectiveDbType = dbType || task.dbType;

    // MongoDB uses its own verification
    if (effectiveDbType === 'mongodb') {
      return verifyMongoDb(sql, task);
    }

    // For multi-statement queries with DML (INSERT/UPDATE/DELETE) followed by SELECT,
    // we need to execute everything on the same database so DML changes persist.
    // First, check if the user's query contains DML statements.
    const hasDml = /(?:^|;)\s*(?:INSERT|UPDATE|DELETE)\b/i.test(sql.trim());

    if (hasDml) {
      return verifyWithSharedDb(sql, task, effectiveDbType);
    }

    // For pure SELECT queries, use the original approach
    return verifySelectOnly(sql, task, effectiveDbType);
  } catch (err: unknown) {
    logger.error('SQL verify error:', err);
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Произошла внутренняя ошибка' },
      { status: 500 },
    );
  }
}

/**
 * Verification path for queries that contain DML (INSERT/UPDATE/DELETE).
 * Executes user SQL and solution SELECT on the same database so DML changes persist.
 */
function verifyWithSharedDb(userSql: string, task: ReturnType<typeof getTaskById>, dbType: string): NextResponse {
  if (!task) {
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
      { status: 404 },
    );
  }

  // Extract the last SELECT from user's query (for result comparison)
  const userSelectSql = extractLastSelect(userSql);
  const solutionSelectSql = extractLastSelect(task.sampleSolution);

  // Execute on the same database: user SQL -> solution SELECT -> user SELECT
  // This ensures INSERTs/UPDATEs from userSql persist for both SELECTs
  const [userResult, solutionResult, userSelectResult] = executeWithSchemaMulti(
    [userSql, solutionSelectSql, userSelectSql],
    task.schema,
    dbType as 'sqlite' | 'postgresql' | 'clickhouse',
  );

  // Check if user's full query executed successfully
  if (!userResult.success) {
    return NextResponse.json({
      verified: false,
      userRowCount: 0,
      expectedRowCount: 0,
      message: userResult.error || 'Ошибка выполнения запроса',
    });
  }

  // If solution fails, fall back to verificationQuery on the same DB state (after user's DML)
  if (!solutionResult.success) {
    const [applyUserDml, verificationResult] = executeWithSchemaMulti(
      [userSql, task.verificationQuery],
      task.schema,
      dbType as 'sqlite' | 'postgresql' | 'clickhouse',
    );

    if (!applyUserDml.success) {
      return NextResponse.json({
        verified: false,
        userRowCount: 0,
        expectedRowCount: 0,
        message: applyUserDml.error || 'Ошибка выполнения запроса',
      });
    }

    const expectedRowCount =
      verificationResult.success && verificationResult.rows.length > 0
        ? Number(verificationResult.rows[0][Object.keys(verificationResult.rows[0])[0]]) || 0
        : 0;

    const verified = expectedRowCount > 0;
    return NextResponse.json({
      verified,
      userRowCount: expectedRowCount,
      expectedRowCount,
      message: verified
        ? `✅ Задание выполнено верно! (${expectedRowCount} строк)`
        : `⚠️ Результат не совпадает с ожидаемым: ${expectedRowCount} строк`,
    });
  }

  return compareResults(userSelectResult, solutionResult);
}

/**
 * Verification path for pure SELECT queries (no DML).
 */
function verifySelectOnly(sql: string, task: ReturnType<typeof getTaskById>, dbType: string): NextResponse {
  if (!task) {
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
      { status: 404 },
    );
  }

  // Execute the user's query with the task schema
  const userResult = executeWithSchema(sql, task.schema, dbType as 'sqlite' | 'postgresql' | 'clickhouse');

  if (!userResult.success) {
    return NextResponse.json({
      verified: false,
      userRowCount: 0,
      expectedRowCount: 0,
      message: userResult.error || 'Ошибка выполнения запроса',
    });
  }

  // Execute the sample solution to get expected results
  const solutionResult = executeWithSchema(
    task.sampleSolution,
    task.schema,
    dbType as 'sqlite' | 'postgresql' | 'clickhouse',
  );

  if (!solutionResult.success) {
    // Fallback to verificationQuery
    const verificationResult = executeWithSchema(
      task.verificationQuery,
      task.schema,
      dbType as 'sqlite' | 'postgresql' | 'clickhouse',
    );
    const expectedRowCount =
      verificationResult.success && verificationResult.rows.length > 0
        ? Number(verificationResult.rows[0][Object.keys(verificationResult.rows[0])[0]]) || 0
        : 0;

    const userRowCount = userResult.rows.length;
    const verified = userRowCount === expectedRowCount && userRowCount > 0;
    return NextResponse.json({
      verified,
      userRowCount,
      expectedRowCount,
      message: verified
        ? `✅ Задание выполнено верно! (${userRowCount} строк)`
        : `⚠️ Результат не совпадает с ожидаемым: ${userRowCount} строк вместо ${expectedRowCount}`,
    });
  }

  return compareResults(userResult, solutionResult);
}

/**
 * Compare user results against expected results.
 */
function compareResults(
  userResult: { success: boolean; columns: string[]; rows: Record<string, unknown>[] },
  solutionResult: { success: boolean; columns: string[]; rows: Record<string, unknown>[] },
): NextResponse {
  const userRowCount = userResult.success ? userResult.rows.length : 0;
  const expectedRowCount = solutionResult.rows.length;

  // Check row count first
  if (userRowCount !== expectedRowCount) {
    let detail = '';
    if (userRowCount === 0) {
      detail = `Запрос вернул 0 строк. Ожидается: ${expectedRowCount}. Проверьте условие WHERE и JOIN.`;
    } else if (userRowCount > expectedRowCount) {
      detail = `Запрос вернул ${userRowCount} строк, ожидается ${expectedRowCount}. Возможно, дублируются строки из-за JOIN или недостаточно строгих условий.`;
    } else {
      detail = `Запрос вернул ${userRowCount} строк, ожидается ${expectedRowCount}. Возможно, пропущены некоторые строки в условии WHERE.`;
    }
    return NextResponse.json({
      verified: false,
      userRowCount,
      expectedRowCount,
      message: `⚠️ Количество строк не совпадает: ${detail}`,
    });
  }

  if (userRowCount === 0) {
    return NextResponse.json({
      verified: false,
      userRowCount: 0,
      expectedRowCount: 0,
      message: '⚠️ Запрос вернул 0 строк. Проверьте, что данные существуют в таблицах.',
    });
  }

  // Check columns match (order-insensitive)
  const userColumns = userResult.columns.map((c) => c.toLowerCase().trim()).sort();
  const expectedColumns = solutionResult.columns.map((c) => c.toLowerCase().trim()).sort();
  const columnsMatch =
    userColumns.length === expectedColumns.length && userColumns.every((col, i) => col === expectedColumns[i]);

  // If columns don't match, provide details
  if (!columnsMatch) {
    const missingCols = expectedColumns.filter((c) => !userColumns.includes(c));
    const extraCols = userColumns.filter((c) => !expectedColumns.includes(c));
    let colDetail = '';
    if (missingCols.length > 0) {
      colDetail += ` Не хватает столбцов: ${missingCols.join(', ')}.`;
    }
    if (extraCols.length > 0) {
      colDetail += ` Лишние столбцы: ${extraCols.join(', ')}.`;
    }
    if (userResult.columns.length !== solutionResult.columns.length) {
      colDetail += ` Ожидается ${expectedColumns.length} столбцов, получено ${userColumns.length}.`;
    }
    return NextResponse.json({
      verified: false,
      userRowCount,
      expectedRowCount,
      message: `⚠️ Столбцы не совпадают.${colDetail} Проверьте SELECT clause.`,
    });
  }

  // Normalize and compare data rows (order-insensitive)
  const userRowsNormalized = userResult.rows.map((row) => normalizeRow(row, userResult.columns)).sort();
  const expectedRowsNormalized = solutionResult.rows.map((row) => normalizeRow(row, solutionResult.columns)).sort();

  const dataMatch = userRowsNormalized.every((row, i) => row === expectedRowsNormalized[i]);

  if (columnsMatch && dataMatch) {
    return NextResponse.json({
      verified: true,
      userRowCount,
      expectedRowCount,
      message: `✅ Задание выполнено верно! (${userRowCount} строк)`,
    });
  }

  // If row count matches but content differs — find first difference
  let diffDetail = '';
  const sortedColumns = [...userResult.columns].sort((a, b) => a.localeCompare(b));
  const userRowsByIndex = userResult.rows.map((row) => sortedColumns.map((col) => normalizeValue(row[col])).join('|'));
  const expectedRowsByIndex = solutionResult.rows.map((row) =>
    sortedColumns.map((col) => normalizeValue(row[col])).join('|'),
  );
  for (let i = 0; i < Math.min(userRowsByIndex.length, expectedRowsByIndex.length); i++) {
    if (userRowsByIndex[i] !== expectedRowsByIndex[i]) {
      const userRow = userResult.rows[i];
      const expectedRow = solutionResult.rows[i];
      const diffCols: string[] = [];
      for (const col of sortedColumns) {
        const uVal = normalizeValue(userRow[col]);
        const eVal = normalizeValue(expectedRow[col]);
        if (uVal !== eVal) {
          diffCols.push(`${col}: получено "${uVal}", ожидается "${eVal}"`);
        }
      }
      diffDetail = ` Строка ${i + 1}: ${diffCols.slice(0, 3).join('; ')}.`;
      break;
    }
  }

  let message = `⚠️ Количество строк совпадает (${userRowCount}), но `;
  if (diffDetail) {
    message += `данные отличаются.${diffDetail} Проверьте вычисления, агрегации и JOIN.`;
  } else {
    message += 'порядок или данные не совпадают. Проверьте SORT ORDER и значения.';
  }

  return NextResponse.json({
    verified: false,
    userRowCount,
    expectedRowCount,
    message,
  });
}

/**
 * Verification for MongoDB tasks.
 * Executes user query and solution query, compares results.
 */
function verifyMongoDb(userQuery: string, task: ReturnType<typeof getTaskById>): NextResponse {
  if (!task) {
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
      { status: 404 },
    );
  }

  let schema: MongoSchema;
  try {
    schema = task.schema ? (JSON.parse(task.schema) as MongoSchema) : {};
  } catch {
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Ошибка схемы данных задания' },
      { status: 500 },
    );
  }

  // Execute user query
  const userResult = executeMongoQuery(userQuery, schema);
  if (!userResult.success) {
    return NextResponse.json({
      verified: false,
      userRowCount: 0,
      expectedRowCount: 0,
      message: userResult.error || 'Ошибка выполнения запроса',
    });
  }

  // Execute solution query
  const solutionResult = executeMongoQuery(task.sampleSolution, schema);
  if (!solutionResult.success) {
    return NextResponse.json({
      verified: false,
      userRowCount: 0,
      expectedRowCount: 0,
      message: 'Ошибка в решении задания',
    });
  }

  const userRowCount = userResult.rows.length;
  const expectedRowCount = solutionResult.rows.length;

  if (userRowCount !== expectedRowCount) {
    return NextResponse.json({
      verified: false,
      userRowCount,
      expectedRowCount,
      message: `⚠️ Количество документов не совпадает: получено ${userRowCount}, ожидается ${expectedRowCount}`,
    });
  }

  // Simple row comparison
  const userJson = JSON.stringify(userResult.rows.sort());
  const expectedJson = JSON.stringify(solutionResult.rows.sort());

  if (userJson === expectedJson) {
    return NextResponse.json({
      verified: true,
      userRowCount,
      expectedRowCount,
      message: `✅ Задание выполнено верно! (${userRowCount} документов)`,
    });
  }

  return NextResponse.json({
    verified: false,
    userRowCount,
    expectedRowCount,
    message: `⚠️ Количество документов совпадает (${userRowCount}), но данные отличаются. Проверьте запрос.`,
  });
}
