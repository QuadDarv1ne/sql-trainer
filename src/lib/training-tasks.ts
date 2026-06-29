/**
 * SQL Training Tasks — Barrel Re-export
 * Tasks are split into modules by difficulty level for maintainability.
 * This file preserves backward compatibility with all existing imports.
 */

export {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  type DbType,
  type Difficulty,
  type TaskCategory,
  type TrainingTask,
} from './tasks/types';

export { BEGINNER_TASKS } from './tasks/beginner';

export { INTERMEDIATE_TASKS } from './tasks/intermediate';

export { ADVANCED_TASKS } from './tasks/advanced';

export { MONGODB_TASKS } from './tasks/mongodb';

export { MYSQL_TASKS } from './tasks/mysql';

// Combined array of all tasks
import { BEGINNER_TASKS } from './tasks/beginner';
import { INTERMEDIATE_TASKS } from './tasks/intermediate';
import { ADVANCED_TASKS } from './tasks/advanced';
import { MONGODB_TASKS } from './tasks/mongodb';
import { MYSQL_TASKS } from './tasks/mysql';
import { logger } from './logger';

// Validate task IDs for uniqueness at module load time
function validateTaskUniqueness(tasks: import('./tasks/types').TrainingTask[]): void {
  const idSet = new Set<string>();
  const duplicates: string[] = [];
  for (const task of tasks) {
    if (idSet.has(task.id)) {
      duplicates.push(task.id);
    } else {
      idSet.add(task.id);
    }
  }
  if (duplicates.length > 0) {
    throw new Error(`Duplicate task IDs found: ${duplicates.join(', ')}`);
  }
}

// Validate at module load time
try {
  validateTaskUniqueness(BEGINNER_TASKS);
  validateTaskUniqueness(INTERMEDIATE_TASKS);
  validateTaskUniqueness(ADVANCED_TASKS);
  validateTaskUniqueness(MONGODB_TASKS);
  validateTaskUniqueness(MYSQL_TASKS);
  validateTaskUniqueness([
    ...BEGINNER_TASKS,
    ...INTERMEDIATE_TASKS,
    ...ADVANCED_TASKS,
    ...MONGODB_TASKS,
    ...MYSQL_TASKS,
  ]);
} catch (err) {
  logger.error('[TRAINING-TASKS] Validation failed:', err);
  throw err;
}

export const TRAINING_TASKS = [
  ...BEGINNER_TASKS,
  ...INTERMEDIATE_TASKS,
  ...ADVANCED_TASKS,
  ...MONGODB_TASKS,
  ...MYSQL_TASKS,
];

export function getTasksByDifficulty(
  difficulty: import('./tasks/types').Difficulty,
): import('./tasks/types').TrainingTask[] {
  return TRAINING_TASKS.filter((t) => t.difficulty === difficulty);
}

export function getTaskById(id: string): import('./tasks/types').TrainingTask | undefined {
  return TRAINING_TASKS.find((t) => t.id === id);
}
