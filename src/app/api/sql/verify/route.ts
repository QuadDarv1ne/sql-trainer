import { NextRequest, NextResponse } from 'next/server';
import { executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

function normalizeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(Math.round(val * 1000) / 1000);
  return String(val).trim().toLowerCase();
}

function normalizeRow(row: Record<string, unknown>, columns: string[]): string {
  return columns.map((col) => normalizeValue(row[col])).join('|');
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

    // Execute the sample solution to get expected results
    const solutionResult = executeWithSchema(task.sampleSolution, task.schema, effectiveDbType);

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

      const verified = userResult.rows.length === expectedRowCount && userResult.rows.length > 0;
      return NextResponse.json({
        verified,
        userRowCount: userResult.rows.length,
        expectedRowCount,
        message: verified
          ? `✅ Задание выполнено верно! (${userResult.rows.length} строк)`
          : `⚠️ Результат не совпадает с ожидаемым: ${userResult.rows.length} строк вместо ${expectedRowCount}`,
      });
    }

    const userRowCount = userResult.rows.length;
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { verified: false, userRowCount: 0, expectedRowCount: 0, message: errorMsg },
      { status: 500 }
    );
  }
}
