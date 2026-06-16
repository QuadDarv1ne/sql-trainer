/**
 * Shared types and constants for training tasks.
 */

import type { ProgressiveHint } from '@/lib/progressive-hints';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type DbType = 'sqlite' | 'postgresql' | 'clickhouse' | 'mongodb' | 'mysql' | 'mssql' | 'oracle';
export type TaskCategory = 'company' | 'shop' | 'analytics' | 'exam';

export interface TrainingTask {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  dbType: DbType;
  schema: string;
  taskText: string;
  hint: string;
  sampleSolution: string;
  verificationQuery: string;
  category?: TaskCategory;
  examGroup?: string;
  progressiveHints?: ProgressiveHint[];
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
