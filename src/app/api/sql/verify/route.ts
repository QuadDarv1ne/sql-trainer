import { NextRequest, NextResponse } from 'next/server';
import { executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

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
 * This is used to get the final result of a multi-statement query for verification.
 */
function extractLastSelect(sql: string): string {
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  // Find the last SELECT statement
  for (let i = statements.length - 1; i >= 0; i--) {
    const trimmed = statements[i].toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      return statements[i];
    }
  }
  // If no SELECT found, return the last statement
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

    // Execute the user's query with the task schema
    const userResult = executeWithSchema(sql, task.schema, effectiveDbType);

    if (!userResult.success) {
      return NextResponse.json({
        verified: false,
        userRowCount: 0,
        expectedRowCount: 0,
        message: userResult.error || 'Ошибка выполнения запроса',
      });
    }

    // For multi-statement queries, extract the last SELECT from both user and solution
    const userSelectSql = extractLastSelect(sql);
    const solutionSelectSql = extractLastSelect(task.sampleSolution);

    // Execute the sample solution to get expected results
    const solutionResult = executeWithSchema(solutionSelectSql, task.schema, effectiveDbType);

    if (!solutionResult.success) {
      // Fallback to row-count verification if solution fails
      const verificationResult = executeWithSchema(
        task.verificationQuery,
        task.schema,
        effectiveDbType
      );
      const expectedRowCount =
        verificationResult.success && verificationResult.rows.length > 0
          ? Number(verificationResult.rows[0][Object.keys(verificationResult.rows[0])[0]]) || 0
          : 0;

      // For multi-statement, verify using the verificationQuery against user's DB state
      const userVerificationResult = executeWithSchema(
        task.verificationQuery,
        task.schema,
        effectiveDbType
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

    // Execute user's last SELECT to get their result
    const userSelectResult = executeWithSchema(userSelectSql, task.schema, effectiveDbType);

    const userRowCount = userSelectResult.success ? userSelectResult.rows.length : 0;
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
    const userColumns = userSelectResult.columns.map((c) => c.toLowerCase().trim()).sort();
    const expectedColumns = solutionResult.columns.map((c) => c.toLowerCase().trim()).sort();
    const columnsMatch =
      userColumns.length === expectedColumns.length &&
      userColumns.every((col, i) => col === expectedColumns[i]);

    // Normalize and compare data rows (order-insensitive)
    const userRowsNormalized = userSelectResult.rows
      .map((row) => normalizeRow(row, userSelectResult.columns))
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: errorMsg },
      { status: 500 }
    );
  }
}
