'use client';

import { useMemo } from 'react';
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
      content:
        'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table + matches from the right (or NULL). RIGHT JOIN is the opposite.',
      color: 'text-blue-600 dark:text-blue-400',
    });
  }

  // GROUP BY / Aggregation tips
  if (
    combined.includes('group by') ||
    combined.includes('count(') ||
    combined.includes('sum(') ||
    combined.includes('avg(')
  ) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'GROUP BY',
      content:
        'After GROUP BY, SELECT can only use columns from GROUP BY and aggregate functions (COUNT, SUM, AVG, MIN, MAX). To filter aggregates use HAVING, not WHERE.',
      color: 'text-emerald-600 dark:text-emerald-400',
    });
  }

  // Window function tips
  if (combined.includes('over') && combined.includes('partition')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'Window Functions',
      content:
        'OVER (PARTITION BY ...) divides data into groups, within which the function is applied. Unlike GROUP BY, window functions do not collapse rows — each row is preserved.',
      color: 'text-violet-600 dark:text-violet-400',
    });
  }

  // ROW_NUMBER / RANK tips
  if (combined.includes('row_number') || combined.includes('rank()') || combined.includes('dense_rank')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'ROW_NUMBER / RANK',
      content:
        'ROW_NUMBER() assigns a unique number to each row. RANK() skips numbers on equal values (1,2,2,4). DENSE_RANK() does not skip (1,2,2,3). Always use ORDER BY inside OVER().',
      color: 'text-purple-600 dark:text-purple-400',
    });
  }

  // CTE / WITH tips
  if (combined.includes('with ') && combined.includes(' as')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'CTE (WITH)',
      content:
        'CTE (Common Table Expression) — a named subquery that can be used multiple times. Makes complex queries readable. Multiple CTEs are separated by commas: WITH cte1 AS (...), cte2 AS (...).',
      color: 'text-amber-600 dark:text-amber-400',
    });
  }

  // Subquery tips
  if (combined.includes('select') && combined.split('select').length > 2 && !combined.includes('with ')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'Subqueries',
      content:
        'A subquery in WHERE (IN, EXISTS) executes for each row of the outer query. EXISTS is more efficient than IN because it stops on the first match. Subqueries in SELECT are computed for each row.',
      color: 'text-orange-600 dark:text-orange-400',
    });
  }

  // COALESCE / NULL handling
  if (
    combined.includes('coalesce') ||
    combined.includes('is null') ||
    combined.includes('ifnull') ||
    combined.includes('isnull')
  ) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'Working with NULL',
      content:
        'NULL means "absence of value" — it is not equal to anything, not even another NULL. Use COALESCE(col, default) to substitute a default value. For comparison: col IS NULL, not col = NULL.',
      color: 'text-red-600 dark:text-red-400',
    });
  }

  // CASE / Conditional
  if (combined.includes('case ') && combined.includes('when')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'CASE',
      content:
        'CASE enables branching in SQL: CASE WHEN condition THEN result [ELSE default] END. Can be used in SELECT, ORDER BY and even GROUP BY. Always end with END!',
      color: 'text-indigo-600 dark:text-indigo-400',
    });
  }

  // EXISTS
  if (combined.includes('exists')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'EXISTS',
      content:
        'EXISTS checks for at least one row in a subquery. Usually faster than IN because it stops on the first match. Often used with correlated subqueries referencing the outer query.',
      color: 'text-teal-600 dark:text-teal-400',
    });
  }

  // DISTINCT
  if (combined.includes('distinct')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'DISTINCT',
      content:
        'DISTINCT removes duplicates from the result. DISTINCT applies to all columns in SELECT simultaneously — uniqueness is determined by the combination of all values. DISTINCT can be slow on large data.',
      color: 'text-yellow-600 dark:text-yellow-400',
    });
  }

  // Date/time functions
  if (
    combined.includes('date') ||
    combined.includes('strftime') ||
    combined.includes('datediff') ||
    combined.includes('toyyyyyy')
  ) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: 'Dates and Time',
      content:
        "Date/time functions differ across DBMS. SQLite: strftime('%Y-%m', date). PostgreSQL: DATE_TRUNC('month', date). MySQL: DATE_FORMAT(date, '%Y-%m'). ClickHouse: toYYYYMM(date).",
      color: 'text-cyan-600 dark:text-cyan-400',
    });
  }

  // String functions
  if (
    combined.includes('concat') ||
    combined.includes('substr') ||
    combined.includes('length') ||
    combined.includes('upper') ||
    combined.includes('lower') ||
    combined.includes('like')
  ) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: 'Strings',
      content:
        "LIKE with % — pattern matching ('%test%' contains 'test'). CONCAT() joins strings. SUBSTR(str, start, len) extracts a substring. Note: string indexing starts at 1 in most DBMS.",
      color: 'text-pink-600 dark:text-pink-400',
    });
  }

  // HAVING
  if (combined.includes('having')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'HAVING',
      content:
        'HAVING filters results after GROUP BY, while WHERE filters before. Use HAVING for conditions with aggregate functions: HAVING COUNT(*) > 1. WHERE cannot be used with aggregates.',
      color: 'text-lime-600 dark:text-lime-400',
    });
  }

  // Limit/Top
  if (combined.includes('limit') || combined.includes('top ') || combined.includes('fetch first')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'Row Limiting',
      content:
        'Syntax varies: SQLite/PostgreSQL/MySQL — LIMIT n. SQL Server — SELECT TOP n. Oracle — FETCH FIRST n ROWS ONLY or ROWNUM. Always use ORDER BY with LIMIT for predictable results.',
      color: 'text-rose-600 dark:text-rose-400',
    });
  }

  // Self-join (detects same table aliased differently)
  if (
    combined.includes('join') &&
    combined.split(' as ').length > 2 &&
    (combined.includes('e1') || combined.includes('e2') || combined.includes('t1') || combined.includes('t2'))
  ) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: 'Self-Join',
      content:
        'A self-join allows joining a table with itself. Use different aliases: FROM employees e1 JOIN employees e2 ON e1.manager_id = e2.id. Useful for hierarchies.',
      color: 'text-sky-600 dark:text-sky-400',
    });
  }

  // ClickHouse-specific
  if (task.dbType === 'clickhouse' || combined.includes('clickhouse')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'ClickHouse',
      content:
        'ClickHouse is optimized for analytical queries on big data. Features: toYYYYMM() for monthly grouping, groupArray() for collecting values into arrays, arrayJoin() for expanding arrays.',
      color: 'text-fuchsia-600 dark:text-fuchsia-400',
    });
  }

  // MySQL-specific
  if (task.dbType === 'mysql' || combined.includes('mysql')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: 'MySQL',
      content:
        'MySQL-specific functions: GROUP_CONCAT() for string concatenation, IF() for conditional logic, FIELD() for custom sort order, ON DUPLICATE KEY UPDATE for upsert operations.',
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
                <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
