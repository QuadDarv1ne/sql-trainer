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
 * Generate progressive hints for a task.
 * If the task has predefined progressiveHints, use them.
 * Otherwise, generate from the old hint field as a fallback.
 */
export function generateProgressiveHints(
  _taskId: string,
  oldHint: string,
  taskText: string,
  progressiveHints?: ProgressiveHint[],
): ProgressiveHint[] {
  // If progressive hints are defined for this task, use them
  if (progressiveHints && progressiveHints.length > 0) {
    return progressiveHints;
  }

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
    'find',
    'show',
    'display',
    'list',
    'calculate',
    'group',
    'sort',
    'order',
    'join',
    'filter',
    'get',
    'count',
    'determine',
  ];

  for (const keyword of keywords) {
    const idx = taskText.toLowerCase().indexOf(keyword);
    if (idx !== -1) {
      const end = taskText.indexOf('.', idx);
      const sentence = end !== -1 ? taskText.slice(idx, end + 1) : taskText.slice(idx);
      return `Think about which SQL constructs you need to ${sentence.toLowerCase()}`;
    }
  }

  return 'Read the task carefully and identify which tables and columns you need';
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
      return `Pay attention to the use of ${keyword.toLowerCase()} in this query`;
    }
  }

  return 'Identify which SQL clauses (JOIN, WHERE, GROUP BY, etc.) are suitable for solving this task';
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
  return hints.filter((h) => h.level <= revealedLevel).reduce((sum, h) => sum + h.xpPenalty, 0);
}
