import { NextRequest, NextResponse } from 'next/server';
import { executeWithSchema, executeWithSchemaMulti } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

const MAX_SQL_LENGTH = 10000;

function normalizeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number(val.toPrecision(10)).toString();
  return String(val).trim().toLowerCase();
}

function normalizeRow(row: Record<string, unknown>, columns: string[]): string {
  return columns.map((col) => normalizeValue(row[col])).join('|');
}

/**
 * Extract the last SELECT statement from a multi-statement SQL string.
 */
function extractLastSelect(sql: string): string {
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
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
    const body = await request.json();
    const { sql, taskId, dbType } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'SQL запрос обязателен' },
        { status: 400 }
      );
    }

    if (sql.length > MAX_SQL_LENGTH) {
      return NextResponse.json(
        { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Запрос слишком длинный' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'taskId обязателен' },
        { status: 400 }
      );
    }

    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
        { status: 404 }
      );
    }

    const effectiveDbType = dbType || task.dbType;

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
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * Verification path for queries that contain DML (INSERT/UPDATE/DELETE).
 * Executes user SQL and solution SELECT on the same database so DML changes persist.
 */
function verifyWithSharedDb(
  userSql: string,
  task: ReturnType<typeof getTaskById>,
  dbType: string
): NextResponse {
  if (!task) {
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
      { status: 404 }
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
    dbType as 'sqlite' | 'postgresql' | 'clickhouse'
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

  // If solution fails, fall back to verificationQuery
  if (!solutionResult.success) {
    const verificationResult = executeWithSchema(
      task.verificationQuery,
      task.schema,
      dbType as 'sqlite' | 'postgresql' | 'clickhouse'
    );
    const expectedRowCount =
      verificationResult.success && verificationResult.rows.length > 0
        ? Number(verificationResult.rows[0][Object.keys(verificationResult.rows[0])[0]]) || 0
        : 0;

    // Run verificationQuery on the same DB state (after user's DML)
    const userVerificationResult = executeWithSchema(
      task.verificationQuery,
      task.schema,
      dbType as 'sqlite' | 'postgresql' | 'clickhouse'
    );
    const userRowCount =
      userVerificationResult.success && userVerificationResult.rows.length > 0
        ? Number(userVerificationResult.rows[0][Object.keys(userVerificationResult.rows[0])[0]]) || 0
        : 0;

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

  return compareResults(userSelectResult, solutionResult);
}

/**
 * Verification path for pure SELECT queries (no DML).
 */
function verifySelectOnly(
  sql: string,
  task: ReturnType<typeof getTaskById>,
  dbType: string
): NextResponse {
  if (!task) {
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: 'Задание не найдено' },
      { status: 404 }
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
    dbType as 'sqlite' | 'postgresql' | 'clickhouse'
  );

  if (!solutionResult.success) {
    // Fallback to verificationQuery
    const verificationResult = executeWithSchema(
      task.verificationQuery,
      task.schema,
      dbType as 'sqlite' | 'postgresql' | 'clickhouse'
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
  solutionResult: { success: boolean; columns: string[]; rows: Record<string, unknown>[] }
): NextResponse {
  const userRowCount = userResult.success ? userResult.rows.length : 0;
  const expectedRowCount = solutionResult.rows.length;

  // Check row count first
  if (userRowCount !== expectedRowCount) {
    return NextResponse.json({
      verified: false,
      userRowCount,
      expectedRowCount,
      message: userRowCount === 0
        ? `⚠️ Запрос вернул 0 строк. Ожидается: ${expectedRowCount}`
        : `⚠️ Количество строк не совпадает: ${userRowCount} вместо ${expectedRowCount}`,
    });
  }

  if (userRowCount === 0) {
    return NextResponse.json({
      verified: false,
      userRowCount: 0,
      expectedRowCount: 0,
      message: '⚠️ Запрос вернул 0 строк',
    });
  }

  // Check columns match (order-insensitive)
  const userColumns = userResult.columns.map((c) => c.toLowerCase().trim()).sort();
  const expectedColumns = solutionResult.columns.map((c) => c.toLowerCase().trim()).sort();
  const columnsMatch =
    userColumns.length === expectedColumns.length &&
    userColumns.every((col, i) => col === expectedColumns[i]);

  // Normalize and compare data rows (order-insensitive)
  const userRowsNormalized = userResult.rows
    .map((row) => normalizeRow(row, userResult.columns))
    .sort();
  const expectedRowsNormalized = solutionResult.rows
    .map((row) => normalizeRow(row, solutionResult.columns))
    .sort();

  const dataMatch = userRowsNormalized.every((row, i) => row === expectedRowsNormalized[i]);

  if (columnsMatch && dataMatch) {
    return NextResponse.json({
      verified: true,
      userRowCount,
      expectedRowCount,
      message: `✅ Задание выполнено верно! (${userRowCount} строк)`,
    });
  }

  // If row count matches but content differs
  let message = `⚠️ Количество строк совпадает (${userRowCount}), но `;
  if (!columnsMatch) {
    message += 'столбцы или данные не совпадают с ожидаемым результатом';
  } else {
    message += 'данные не совпадают с ожидаемым результатом';
  }

  return NextResponse.json({
    verified: false,
    userRowCount,
    expectedRowCount,
    message,
  });
}
