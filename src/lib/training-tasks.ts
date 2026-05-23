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

export {
  BEGINNER_TASKS,
} from './tasks/beginner';

export {
  INTERMEDIATE_TASKS,
} from './tasks/intermediate';

export {
  ADVANCED_TASKS,
} from './tasks/advanced';

export {
  CLICKHOUSE_TASKS,
} from './tasks/clickhouse';

// Combined array of all tasks, preserving original order (clickhouse tasks are already in difficulty files)
import { BEGINNER_TASKS } from './tasks/beginner';
import { INTERMEDIATE_TASKS } from './tasks/intermediate';
import { ADVANCED_TASKS } from './tasks/advanced';

export const TRAINING_TASKS = [...BEGINNER_TASKS, ...INTERMEDIATE_TASKS, ...ADVANCED_TASKS];

export function getTasksByDifficulty(difficulty: import('./tasks/types').Difficulty): import('./tasks/types').TrainingTask[] {
  return TRAINING_TASKS.filter((t) => t.difficulty === difficulty);
}

export function getTaskById(id: string): import('./tasks/types').TrainingTask | undefined {
  return TRAINING_TASKS.find((t) => t.id === id);
}
