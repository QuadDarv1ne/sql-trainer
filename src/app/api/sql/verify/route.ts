import { NextRequest, NextResponse } from 'next/server';
import { executeWithSchema, executeWithSchemaMulti } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

const MAX_SQL_LENGTH = 10000;

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
  return columns.map((col) => normalizeValue(row[col])).join('|');
}

/**
 * Split SQL statements respecting string literals.
 * Handles both single-quote (SQL standard) and double-quote identifiers.
 */
function splitStatementsSafe(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      if (char === stringChar) {
        const next = sql[i + 1];
        if (next === stringChar) {
          // Escaped quote ('' or "")
          i++;
          current += next;
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const last = current.trim();
  if (last.length > 0) {
    statements.push(last);
  }

  return statements;
}

/**
 * Extract the last SELECT statement from a multi-statement SQL string.
 */
function extractLastSelect(sql: string): string {
  const statements = splitStatementsSafe(sql);
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

  // If solution fails, fall back to verificationQuery on the same DB state (after user's DML)
  if (!solutionResult.success) {
    const [applyUserDml, verificationResult] = executeWithSchemaMulti(
      [userSql, task.verificationQuery],
      task.schema,
      dbType as 'sqlite' | 'postgresql' | 'clickhouse'
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
    userColumns.length === expectedColumns.length &&
    userColumns.every((col, i) => col === expectedColumns[i]);

  // If columns don't match, provide details
  if (!columnsMatch) {
    const missingCols = expectedColumns.filter(c => !userColumns.includes(c));
    const extraCols = userColumns.filter(c => !expectedColumns.includes(c));
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

  // If row count matches but content differs — find first difference
  let diffDetail = '';
  for (let i = 0; i < Math.min(userRowsNormalized.length, expectedRowsNormalized.length); i++) {
    if (userRowsNormalized[i] !== expectedRowsNormalized[i]) {
      const cols = userResult.columns;
      const userRow = userResult.rows[i];
      const expectedRow = solutionResult.rows[i];
      const diffCols: string[] = [];
      for (const col of cols) {
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
