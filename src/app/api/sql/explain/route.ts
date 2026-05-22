import { NextRequest, NextResponse } from 'next/server';
import { explainQuery } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';

const MAX_SQL_LENGTH = 10000;
const VALID_DB_TYPES = ['sqlite', 'postgresql'] as const;

/**
 * Analyze EXPLAIN plan and return performance suggestions.
 */
function analyzePlan(plan: string, sql: string): string[] {
  const suggestions: string[] = [];
  const planLower = plan.toLowerCase();
  const sqlUpper = sql.toUpperCase();

  // Full table scan detection
  if (planLower.includes('scan') && !planLower.includes('index')) {
    suggestions.push('Полное сканирование таблицы. Рассмотрите добавление индекса для ускорения запроса.');
  }

  // JOIN without index
  if (planLower.includes('join') && planLower.includes('scan')) {
    suggestions.push('JOIN без индекса может быть медленным. Добавьте индексы на поля соединения.');
  }

  // DISTINCT or GROUP BY might be slow
  if (sqlUpper.includes('DISTINCT') || sqlUpper.includes('GROUP BY')) {
    if (planLower.includes('scan')) {
      suggestions.push('DISTINCT/GROUP BY с полным сканированием может быть медленным. Рассмотрите индексы.');
    }
  }

  // ORDER BY without index
  if (sqlUpper.includes('ORDER BY') && !planLower.includes('index')) {
    suggestions.push('ORDER BY может использовать filesort. Индекс на сортируемых полях ускорит запрос.');
  }

  // Subquery detected
  if (sqlUpper.includes('SELECT') && sqlUpper.indexOf('SELECT') !== sqlUpper.lastIndexOf('SELECT')) {
    suggestions.push('Подзапрос обнаружен. Рассмотрите использование JOIN для потенциального ускорения.');
  }

  // LIKE with leading wildcard
  if (sqlUpper.match(/LIKE\s+['"]%/)) {
    suggestions.push('LIKE с ведущим символом % не использует индексы. Попробуйте полнотекстовый поиск.');
  }

  return suggestions;
}

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

    if (sql.length > MAX_SQL_LENGTH) {
      return NextResponse.json(
        { success: false, error: 'Запрос слишком длинный' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId обязателен для EXPLAIN' },
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

    const effectiveDbType = VALID_DB_TYPES.includes(dbType as typeof VALID_DB_TYPES[number]) ? dbType : 'sqlite';
    const result = explainQuery(sql, task.schema, effectiveDbType);

    if (result.success && result.plan) {
      const suggestions = analyzePlan(result.plan, sql);
      return NextResponse.json({ ...result, suggestions });
    }

    return NextResponse.json(result);
  } catch (_err: unknown) {
    return NextResponse.json(
      { success: false, error: 'Произошла внутренняя ошибка' },
      { status: 500 }
    );
  }
}
