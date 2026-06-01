'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, BookOpen, Code, AlertCircle } from 'lucide-react';
import type { TrainingTask } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';

interface ContextualTip {
  icon: React.ReactNode;
  title: string;
  content: string;
  color: string;
}

/** Detect SQL concepts from a task and return relevant educational tips */
export function getContextualTips(task: TrainingTask): ContextualTip[] {
  const tips: ContextualTip[] = [];
  const { taskText, sampleSolution, hint } = task;
  const combined = `${taskText} ${sampleSolution} ${hint}`.toLowerCase();

  // JOIN tips
  if (combined.includes('join')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'JOIN',
      content: 'INNER JOIN возвращает только совпадающие строки из обеих таблиц. LEFT JOIN — все строки из левой таблицы + совпадения из правой (или NULL). RIGHT JOIN — наоборот.',
      color: 'text-blue-600 dark:text-blue-400',
    });
  }

  // GROUP BY / Aggregation tips
  if (combined.includes('group by') || combined.includes('count(') || combined.includes('sum(') || combined.includes('avg(')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'GROUP BY',
      content: 'После GROUP BY в SELECT можно использовать только столбцы из GROUP BY и агрегатные функции (COUNT, SUM, AVG, MIN, MAX). Для фильтрации агрегатов используйте HAVING, а не WHERE.',
      color: 'text-emerald-600 dark:text-emerald-400',
    });
  }

  // Window function tips
  if (combined.includes('over') && combined.includes('partition')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'Оконные функции',
      content: 'OVER (PARTITION BY ...) делит данные на группы, внутри которых применяется функция. В отличие от GROUP BY, оконные функции не «схлопывают» строки — каждая строка сохраняется.',
      color: 'text-violet-600 dark:text-violet-400',
    });
  }

  // ROW_NUMBER / RANK tips
  if (combined.includes('row_number') || combined.includes('rank()') || combined.includes('dense_rank')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'ROW_NUMBER / RANK',
      content: 'ROW_NUMBER() даёт уникальный номер каждой строке. RANK() пропускает номера при одинаковых значениях (1,2,2,4). DENSE_RANK() не пропускает (1,2,2,3). Всегда используйте ORDER BY внутри OVER().',
      color: 'text-purple-600 dark:text-purple-400',
    });
  }

  // CTE / WITH tips
  if (combined.includes('with ') && combined.includes(' as')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'CTE (WITH)',
      content: 'CTE (Common Table Expression) — именованный подзапрос, который можно использовать несколько раз. Делает сложный запрос читаемым. Несколько CTE разделяются запятой: WITH cte1 AS (...), cte2 AS (...)',
      color: 'text-amber-600 dark:text-amber-400',
    });
  }

  // Subquery tips
  if (combined.includes('select') && combined.split('select').length > 2 && !combined.includes('with ')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'Подзапросы',
      content: 'Подзапрос в WHERE (IN, EXISTS) выполняется для каждой строки внешнего запроса. EXISTS эффективнее IN, т.к. останавливается на первом совпадении. Подзапросы в SELECT вычисляются для каждой строки.',
      color: 'text-orange-600 dark:text-orange-400',
    });
  }

  // COALESCE / NULL handling
  if (combined.includes('coalesce') || combined.includes('is null') || combined.includes('ifnull') || combined.includes('isnull')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'Работа с NULL',
      content: 'NULL — это «отсутствие значения», он не равен ничему, даже другому NULL. Используйте COALESCE(col, default) для подстановки значения по умолчанию. Для сравнения: col IS NULL, а не col = NULL.',
      color: 'text-red-600 dark:text-red-400',
    });
  }

  // CASE / Conditional
  if (combined.includes('case ') && combined.includes('when')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'CASE',
      content: 'CASE позволяет ветвление в SQL: CASE WHEN condition THEN result [ELSE default] END. Можно использовать в SELECT, ORDER BY и даже GROUP BY. Всегда заканчивайте END!',
      color: 'text-indigo-600 dark:text-indigo-400',
    });
  }

  // EXISTS
  if (combined.includes('exists')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'EXISTS',
      content: 'EXISTS проверяет наличие хотя бы одной строки в подзапросе. Обычно быстрее IN, т.к. останавливается на первом совпадении. Часто используется с коррелированным подзапросом, ссылающимся на внешний запрос.',
      color: 'text-teal-600 dark:text-teal-400',
    });
  }

  // DISTINCT
  if (combined.includes('distinct')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'DISTINCT',
      content: 'DISTINCT убирает дубликаты из результата. DISTINCT применяется ко всем столбцам в SELECT одновременно — уникальность определяется комбинацией всех значений. DISTINCT может быть медленным на больших данных.',
      color: 'text-yellow-600 dark:text-yellow-400',
    });
  }

  // Date/time functions
  if (combined.includes('date') || combined.includes('strftime') || combined.includes('datediff') || combined.includes('toyyyyyy')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'Даты и время',
      content: 'Функции работы с датами различаются в разных СУБД. SQLite: strftime(\'%Y-%m\', date). PostgreSQL: DATE_TRUNC(\'month\', date). MySQL: DATE_FORMAT(date, \'%Y-%m\'). ClickHouse: toYYYYMM(date).',
      color: 'text-cyan-600 dark:text-cyan-400',
    });
  }

  // String functions
  if (combined.includes('concat') || combined.includes('substr') || combined.includes('length') || combined.includes('upper') || combined.includes('lower') || combined.includes('like')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'Строки',
      content: 'LIKE с % — поиск по шаблону (\'%test%\' содержит «test»). CONCAT() объединяет строки. SUBSTR(str, start, len) извлекает подстроку. Обратите внимание: индексация строк начинается с 1 в большинстве СУБД.',
      color: 'text-pink-600 dark:text-pink-400',
    });
  }

  // HAVING
  if (combined.includes('having')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'HAVING',
      content: 'HAVING фильтрует результаты после GROUP BY, а WHERE — до. Используйте HAVING для условий с агрегатными функциями: HAVING COUNT(*) > 1. WHERE нельзя использовать с агрегатами.',
      color: 'text-lime-600 dark:text-lime-400',
    });
  }

  // Limit/Top
  if (combined.includes('limit') || combined.includes('top ') || combined.includes('fetch first')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'Ограничение строк',
      content: 'Синтаксис различается: SQLite/PostgreSQL/MySQL — LIMIT n. SQL Server — SELECT TOP n. Oracle — FETCH FIRST n ROWS ONLY или ROWNUM. Всегда используйте ORDER BY с LIMIT для предсказуемого результата.',
      color: 'text-rose-600 dark:text-rose-400',
    });
  }

  // Self-join (detects same table aliased differently)
  if ((combined.includes('join') && combined.split(' as ').length > 2) && (combined.includes('e1') || combined.includes('e2') || combined.includes('t1') || combined.includes('t2'))) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'Самосоединение',
      content: 'Самосоединение (self-join) позволяет соединить таблицу с самой собой. Необходимо использовать разные алиасы: FROM employees e1 JOIN employees e2 ON e1.manager_id = e2.id. Полезно для иерархий.',
      color: 'text-sky-600 dark:text-sky-400',
    });
  }

  // ClickHouse-specific
  if (task.dbType === 'clickhouse' || combined.includes('clickhouse')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'ClickHouse',
      content: 'ClickHouse оптимизирован для аналитических запросов на больших данных. Особенности: toYYYYMM() для группировки по месяцам, groupArray() для сбора значений в массив, arrayJoin() для раскрытия массивов.',
      color: 'text-fuchsia-600 dark:text-fuchsia-400',
    });
  }

  // MySQL-specific
  if (task.dbType === 'mysql' || combined.includes('mysql')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'MySQL',
      content: 'MySQL-специфичные функции: GROUP_CONCAT() для объединения строк, IF() для условной логики, FIELD() для сортировки по заданному порядку, ON DUPLICATE KEY UPDATE для upsert-операций.',
      color: 'text-amber-600 dark:text-amber-400',
    });
  }

  return tips.slice(0, 2); // Show at most 2 tips to avoid overwhelming
}

interface ContextualTipsProps {
  task: TrainingTask;
}

export default function ContextualTips({ task }: ContextualTipsProps) {
  const tips = useMemo(() => getContextualTips(task), [task]);

  if (tips.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        {t('contextualTips.label')}
      </h4>
      {tips.map((tip, i) => (
        <Card key={i} className="bg-muted/20 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <span className={`shrink-0 mt-0.5 ${tip.color}`}>{tip.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                    {tip.title}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tip.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
