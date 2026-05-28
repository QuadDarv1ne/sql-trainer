/**
 * Progressive Hints System
 *
 * Three-tier hint system that progressively reveals more details:
 * - Level 1: General idea/concept (no penalty)
 * - Level 2: Specific direction/approach (small XP penalty)
 * - Level 3: Concrete syntax/structure (larger XP penalty)
 */

export interface ProgressiveHint {
  level: 1 | 2 | 3;
  text: string;
  xpPenalty: number;
}

export interface ProgressiveHintsConfig {
  [taskId: string]: ProgressiveHint[];
}

/**
 * Generate progressive hints from existing single-hint tasks.
 * This is a fallback that parses the old hint format and creates level 3 hint.
 * New tasks should define all three levels explicitly.
 */
export function generateProgressiveHints(
  taskId: string,
  oldHint: string,
  taskText: string,
  _sampleSolution: string
): ProgressiveHint[] {
  // For tasks that haven't been migrated yet, create a single level 3 hint
  // from the old hint field, and generate basic level 1 and 2
  return [
    {
      level: 1,
      text: generateLevel1Hint(taskText),
      xpPenalty: 0,
    },
    {
      level: 2,
      text: generateLevel2Hint(oldHint),
      xpPenalty: 5,
    },
    {
      level: 3,
      text: oldHint,
      xpPenalty: 15,
    },
  ];
}

/**
 * Generate a level 1 hint from task description.
 * Level 1: General idea - restate what needs to be done in simpler terms.
 */
function generateLevel1Hint(taskText: string): string {
  // Extract the main action from the task
  const keywords = [
    'найдите', 'выведите', 'посчитайте', 'определите', 'сгруппируйте',
    'отсортируйте', 'объедините', 'фильтруйте', 'вычислите', 'покажите'
  ];

  for (const keyword of keywords) {
    const idx = taskText.toLowerCase().indexOf(keyword);
    if (idx !== -1) {
      const end = taskText.indexOf('.', idx);
      const sentence = end !== -1 ? taskText.slice(idx, end + 1) : taskText.slice(idx);
      return `Подумайте, какие SQL-конструкции нужны, чтобы ${sentence.toLowerCase()}`;
    }
  }

  return 'Внимательно прочитайте условие и определите, какие таблицы и столбцы вам понадобятся';
}

/**
 * Generate a level 2 hint from the old hint.
 * Level 2: Direction - which SQL clauses/functions to use.
 */
function generateLevel2Hint(oldHint: string): string {
  // If hint mentions specific functions or clauses, use it as direction
  const sqlKeywords = ['JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'COUNT', 'SUM', 'AVG', 'CASE', 'SUBQUERY'];

  for (const keyword of sqlKeywords) {
    if (oldHint.toUpperCase().includes(keyword)) {
      return `Обратите внимание на использование ${keyword.toLowerCase()} в этом запросе`;
    }
  }

  return 'Определите, какие SQL-конструкции (JOIN, WHERE, GROUP BY и т.д.) подходят для решения этой задачи';
}

/**
 * Get the next hint level based on current revealed level.
 * Returns null if no more hints available.
 */
export function getNextHintLevel(currentLevel: number | null): 1 | 2 | 3 | null {
  if (currentLevel === null) return 1;
  if (currentLevel === 1) return 2;
  if (currentLevel === 2) return 3;
  return null;
}

/**
 * Calculate total XP penalty for all revealed hints.
 */
export function calculateHintPenalty(hints: ProgressiveHint[], revealedLevel: number): number {
  return hints
    .filter(h => h.level <= revealedLevel)
    .reduce((sum, h) => sum + h.xpPenalty, 0);
}
