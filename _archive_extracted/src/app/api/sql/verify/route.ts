import { NextRequest, NextResponse } from 'next/server';
import { executeWithSchema } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, taskId, dbType, userRowCount } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId обязателен' },
        { status: 400 }
      );
    }

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL запрос обязателен' },
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

    if (!task.verificationQuery) {
      return NextResponse.json({
        success: true,
        verified: true,
        userRowCount: userRowCount || 0,
        expectedRowCount: 0,
        message: 'Задание не имеет проверки по количеству строк.',
      });
    }

    // Execute the verification query to get expected row count
    const effectiveDbType = dbType || task.dbType;
    const verificationResult = executeWithSchema(task.verificationQuery, task.schema, effectiveDbType);

    if (!verificationResult.success) {
      return NextResponse.json({
        success: true,
        verified: false,
        userRowCount: userRowCount || 0,
        expectedRowCount: 0,
        message: `Ошибка проверки: ${verificationResult.error || 'Неизвестная ошибка'}`,
      });
    }

    const expectedRowCount = verificationResult.rows.length > 0
      ? (verificationResult.rows[0].count as number) ?? (verificationResult.rows[0].expected_count as number) ?? verificationResult.rows.length
      : 0;

    const userRows = userRowCount || 0;
    const isVerified = userRows === expectedRowCount;

    let message: string;
    if (isVerified) {
      message = `Задание выполнено правильно! (${userRows} строк)`;
    } else if (userRows === 0) {
      message = `Запрос вернул 0 строк. Ожидается: ${expectedRowCount}. Проверьте условие WHERE.`;
    } else if (userRows > expectedRowCount) {
      message = `Результат содержит больше строк, чем ожидалось: ${userRows} вместо ${expectedRowCount}. Попробуйте добавить WHERE.`;
    } else {
      message = `Результат содержит меньше строк, чем ожидалось: ${userRows} вместо ${expectedRowCount}. Проверьте WHERE.`;
    }

    return NextResponse.json({
      success: true,
      verified: isVerified,
      userRowCount: userRows,
      expectedRowCount,
      message,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg, verified: false, userRowCount: 0, expectedRowCount: 0, message: errorMsg },
      { status: 500 }
    );
  }
}
