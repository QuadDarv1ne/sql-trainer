/**
 * Zustand Store for SQL Trainer — Re-exports from modular store.
 * This file maintains backward compatibility with existing imports.
 *
 * The actual store implementation has been split into modular slices:
 * @see store/database-slice.ts
 * @see store/progress-slice.ts
 * @see store/gamification-slice.ts
 * @see store/practice-mode-slice.ts
 * @see store/ui-slice.ts
 * @see store/index.ts
 */
export * from './store/index';
