/**
 * Concept-aware task recommendation system.
 * Detects SQL concepts from task solutions and recommends tasks that fill knowledge gaps.
 */

import type { TrainingTask } from './tasks/types';

/** SQL concepts we track for educational progression */
export type SQLConcept =
  | 'select_basic'
  | 'where_filter'
  | 'order_by'
  | 'group_by'
  | 'aggregate_functions'
  | 'having'
  | 'inner_join'
  | 'left_join'
  | 'self_join'
  | 'subquery_where'
  | 'subquery_select'
  | 'cte'
  | 'window_function'
  | 'row_number'
  | 'case_when'
  | 'coalesce'
  | 'distinct'
  | 'union'
  | 'date_functions'
  | 'string_functions'
  | 'limit_top'
  | 'exists'
  | 'insert'
  | 'update'
  | 'delete'
  | 'constraints';

/** Detect which SQL concepts are present in a task's solution */
export function detectConcepts(sql: string): Set<SQLConcept> {
  const s = sql.toLowerCase().replace(/\s+/g, ' ').trim();
  const concepts = new Set<SQLConcept>();

  // Basic concepts
  if (/\bselect\b/.test(s)) concepts.add('select_basic');
  if (/\bwhere\b/.test(s)) concepts.add('where_filter');
  if (/\border\s+by\b/.test(s)) concepts.add('order_by');
  if (/\bgroup\s+by\b/.test(s)) concepts.add('group_by');

  // Aggregates
  if (/\b(count|sum|avg|min|max)\s*\(/.test(s)) concepts.add('aggregate_functions');
  if (/\bhaving\b/.test(s)) concepts.add('having');

  // Joins
  if (/\binner\s+join\b/.test(s) || (/\bjoin\b/.test(s) && !/\b(left|right|full|cross)\s+join\b/.test(s))) {
    concepts.add('inner_join');
  }
  if (/\bleft\s+(outer\s+)?join\b/.test(s)) concepts.add('left_join');
  if (/\bright\s+(outer\s+)?join\b/.test(s)) concepts.add('left_join'); // treat same for progression
  if (/\bfrom\s+\w+\s+\w+.*\bjoin\s+\w+\s+\w+\s+on\b/.test(s) && s.split(/\bfrom\b/).length > 1) {
    // Self-join: same table name appears twice with different aliases
    const fromMatches = s.match(/\bfrom\s+(\w+)\s+(\w+)/g);
    const joinMatches = s.match(/\bjoin\s+(\w+)\s+(\w+)/g);
    if (fromMatches && joinMatches) {
      const tables = new Set<string>();
      [...fromMatches, ...joinMatches].forEach((m) => {
        const parts = m.split(/\s+/);
        if (parts.length >= 3) tables.add(parts[1]);
      });
      for (const table of tables) {
        const occurrences = s.split(new RegExp(`\\b${table}\\b`, 'g')).length - 1;
        if (occurrences >= 3) { // appears in FROM + JOIN + ON
          concepts.add('self_join');
          break;
        }
      }
    }
  }

  // Subqueries
  const selectCount = (s.match(/\bselect\b/g) || []).length;
  if (selectCount > 1) {
    if (/\bwhere\b.*\bselect\b/.test(s) || /\bwhere\b[^;]*\([^)]*select/i.test(sql)) {
      concepts.add('subquery_where');
    }
    if (/\bselect\b.*,\s*\([^)]*select\b/i.test(sql)) {
      concepts.add('subquery_select');
    }
    if (!concepts.has('subquery_where') && !concepts.has('subquery_select')) {
      concepts.add('subquery_where'); // default to subquery concept
    }
  }

  // CTE
  if (/\bwith\s+\w+\s+as\s*\(/.test(s)) concepts.add('cte');

  // Window functions
  if (/\bover\s*\(/.test(s)) concepts.add('window_function');
  if (/\brow_number\s*\(\s*\)\s*over\b/.test(s)) concepts.add('row_number');
  if (/\b(rank|dense_rank|ntile|lag|lead|first_value|last_value)\s*\(/.test(s)) concepts.add('window_function');

  // Conditionals
  if (/\bcase\s+when\b/.test(s)) concepts.add('case_when');

  // NULL handling
  if (/\bcoalesce\s*\(/.test(s) || /\bisnull\s*\(/.test(s) || /\bifnull\s*\(/.test(s)) concepts.add('coalesce');

  // Distinct
  if (/\bdistinct\b/.test(s)) concepts.add('distinct');

  // Union
  if (/\bunion\s+all\b/.test(s) || /\bunion\b/.test(s)) concepts.add('union');

  // Date functions
  if (/\b(date|strftime|datediff|date_format|date_trunc|toyyyymm|extract|date_add|date_sub|now|current_date)\b/.test(s)) {
    concepts.add('date_functions');
  }

  // String functions
  if (/\b(concat|substr|substring|length|upper|lower|trim|replace|like|left|right|charindex)\b/.test(s)) {
    concepts.add('string_functions');
  }

  // Limit/Top
  if (/\blimit\s+\d/.test(s) || /\btop\s+\d/.test(s) || /\bfetch\s+first\b/.test(s)) concepts.add('limit_top');

  // EXISTS
  if (/\bexists\s*\(/.test(s)) concepts.add('exists');

  // DML
  if (/\binsert\s+into\b/.test(s)) concepts.add('insert');
  if (/\bupdate\s+\w+\s+set\b/.test(s)) concepts.add('update');
  if (/\bdelete\s+from\b/.test(s)) concepts.add('delete');

  // Constraints
  if (/\b(primary\s+key|foreign\s+key|unique|check|not\s+null|default\s|references\s)\b/.test(s)) {
    concepts.add('constraints');
  }

  return concepts;
}

/**
 * Get concepts practiced by the user based on completed tasks.
 */
export function getPracticedConcepts(
  completedTaskIds: string[],
  allTasks: TrainingTask[]
): Set<SQLConcept> {
  const practiced = new Set<SQLConcept>();
  for (const ct of completedTaskIds) {
    const task = allTasks.find((t) => t.id === ct);
    if (task) {
      const taskConcepts = detectConcepts(task.sampleSolution);
      taskConcepts.forEach((c) => practiced.add(c));
    }
  }
  return practiced;
}

/**
 * Recommend a task that practices a concept the user hasn't encountered yet.
 * Falls back to difficulty-based recommendation if no concept gaps found.
 *
 * Returns { task, missingConcept } or null.
 */
export function recommendByConcept(
  completedTaskIds: string[],
  allTasks: TrainingTask[],
  targetDifficulty: string | null
): { task: TrainingTask; missingConcept: SQLConcept } | null {
  const completedSet = new Set(completedTaskIds);
  const practicedConcepts = getPracticedConcepts(completedTaskIds, allTasks);

  // Priority order of concepts for learning progression
  const conceptPriority: SQLConcept[] = [
    'select_basic',
    'where_filter',
    'order_by',
    'distinct',
    'aggregate_functions',
    'group_by',
    'having',
    'coalesce',
    'case_when',
    'inner_join',
    'left_join',
    'self_join',
    'subquery_where',
    'cte',
    'window_function',
    'row_number',
    'exists',
    'date_functions',
    'string_functions',
    'limit_top',
    'union',
    'insert',
    'update',
    'delete',
    'constraints',
  ];

  // Find first unpracticed concept in priority order
  for (const concept of conceptPriority) {
    if (practicedConcepts.has(concept)) continue;

    // Find an incomplete task at the target difficulty that uses this concept
    const candidates = allTasks.filter(
      (t) =>
        !completedSet.has(t.id) &&
        (!targetDifficulty || t.difficulty === targetDifficulty) &&
        detectConcepts(t.sampleSolution).has(concept)
    );

    if (candidates.length > 0) {
      return { task: candidates[0], missingConcept: concept };
    }
  }

  // No concept gap found at target difficulty — try any difficulty
  for (const concept of conceptPriority) {
    if (practicedConcepts.has(concept)) continue;

    const candidates = allTasks.filter(
      (t) => !completedSet.has(t.id) && detectConcepts(t.sampleSolution).has(concept)
    );

    if (candidates.length > 0) {
      return { task: candidates[0], missingConcept: concept };
    }
  }

  return null;
}

/** Human-readable labels for SQL concepts */
export const CONCEPT_LABELS: Record<SQLConcept, string> = {
  select_basic: 'SELECT',
  where_filter: 'WHERE',
  order_by: 'ORDER BY',
  group_by: 'GROUP BY',
  aggregate_functions: 'Агрегатные функции',
  having: 'HAVING',
  inner_join: 'INNER JOIN',
  left_join: 'LEFT JOIN',
  self_join: 'Самосоединение',
  subquery_where: 'Подзапрос в WHERE',
  subquery_select: 'Подзапрос в SELECT',
  cte: 'CTE (WITH)',
  window_function: 'Оконные функции',
  row_number: 'ROW_NUMBER',
  case_when: 'CASE WHEN',
  coalesce: 'COALESCE / NULL',
  distinct: 'DISTINCT',
  union: 'UNION',
  date_functions: 'Функции дат',
  string_functions: 'Функции строк',
  limit_top: 'LIMIT / TOP',
  exists: 'EXISTS',
  insert: 'INSERT',
  update: 'UPDATE',
  delete: 'DELETE',
  constraints: 'Constraints',
};
