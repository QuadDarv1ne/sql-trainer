/**
 * Zustand Store for SQL Trainer — Modular Composition
 *
 * Composes individual slices into a single store with localStorage persistence.
 * Each slice manages a distinct domain of state:
 * - database-slice: DB type, editor, query results, verification
 * - progress-slice: completed tasks, bookmarks, streak, history, saved queries
 * - gamification-slice: XP, levels, achievements
 * - practice-mode-slice: shuffled practice sessions
 * - ui-slice: panel/sidebar visibility
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDatabaseSlice, type DatabaseSlice } from './database-slice';
import { createProgressSlice, type ProgressSlice, defaultStreak } from './progress-slice';
import { createGamificationSlice, type GamificationSlice, type Achievement, defaultStats } from './gamification-slice';
import { createPracticeModeSlice, type PracticeModeSlice } from './practice-mode-slice';
import { createUISlice, type UISlice } from './ui-slice';
import { createOnboardingSlice, type OnboardingSlice } from './onboarding-slice';
import { createTimerSlice } from './timer-slice';
import type { TimerSlice } from './timer-slice-types';
import { TRAINING_TASKS, getTaskById } from '@/lib/training-tasks';
import { calculateLevel } from './level-calculator';

// Snapshot for undoing progress reset (30-second window)
type ProgressSnapshot = {
  completedTasks: import('./progress-slice').CompletedTask[];
  bookmarkedTasks: string[];
  queryHistory: import('./progress-slice').QueryHistoryEntry[];
  savedQueries: import('./progress-slice').SavedQuery[];
  streak: import('./progress-slice').StreakInfo;
  userStats: import('./gamification-slice').UserStats;
  achievements: string[];
  unlockedAchievements: import('./gamification-slice').Achievement[];
};

// Export types for consumers
export type { QueryHistoryEntry, CompletedTask, StreakInfo, SavedQuery } from './progress-slice';
export type { QueryResult, VerificationResult } from './database-slice';
export type { Achievement, UserStats } from './gamification-slice';
export { ACHIEVEMENTS } from './gamification-slice';

export interface ExportData {
  version: number;
  exportedAt: string;
  completedTasks: import('./progress-slice').CompletedTask[];
  bookmarkedTasks: string[];
  streak: import('./progress-slice').StreakInfo;
  queryHistory: import('./progress-slice').QueryHistoryEntry[];
  savedQueries: import('./progress-slice').SavedQuery[];
  userStats: import('./gamification-slice').UserStats;
  achievements: string[];
  unlockedAchievements: Achievement[];
}

// Combined type merges all slices + export/import + enhanced setters
type CombinedState = DatabaseSlice &
  ProgressSlice &
  GamificationSlice &
  PracticeModeSlice &
  UISlice &
  OnboardingSlice &
  TimerSlice & {
    _resetSnapshot: ProgressSnapshot | null;
    _resetSnapshotTime: number;
    exportProgress: () => ExportData;
    importProgress: (data: ExportData) => { success: boolean; error?: string };
    undoReset: () => void;
  };

// Type helpers for composing narrow slices into the wider CombinedState.
// Each slice creator is typed against its own narrow state, but the composed
// store passes the full CombinedState's set/get/store. These casts bridge that gap.
// This is the recommended Zustand pattern for slice composition.
import type { StoreApi } from 'zustand';

type SliceSet = StoreApi<CombinedState>['setState'];
type SliceGet = StoreApi<CombinedState>['getState'];
type SliceStore = StoreApi<CombinedState>;

export const useSQLTrainerStore = create<CombinedState>()(
  persist(
    (set, get, store) => ({
      // Database slice
      ...createDatabaseSlice(set as SliceSet, get as SliceGet, store as SliceStore),

      // Progress slice — spread base implementation first to satisfy ProgressSlice type
      ...createProgressSlice(set as SliceSet, get as SliceGet, store as SliceStore),

      // Override markTaskCompleted to include gamification (cross-slice coordination)
      markTaskCompleted: (taskId: string, attempts: number) => {
        set((state) => {
          const updatedCompletedTasks = [
            ...state.completedTasks.filter((t) => t.taskId !== taskId),
            { taskId, completedAt: Date.now(), attempts },
          ];

          const wasHintFree = state.hintLevel === 0;
          const newHintFreeCount = wasHintFree ? state.userStats.hintFreeCount + 1 : state.userStats.hintFreeCount;

          const { xpGained } = state.checkAndUnlockAchievements({
            completedTasks: updatedCompletedTasks,
            queryHistoryLength: state.queryHistory.length,
            currentStreak: state.streak.currentStreak,
            taskId,
            attempts,
            hintFreeCount: newHintFreeCount,
          });

          const xpToAdd = xpGained > 0 ? xpGained : 0;
          const newXp = state.userStats.xp + xpToAdd;
          const { level, progress } = calculateLevel(newXp);

          return {
            completedTasks: updatedCompletedTasks,
            userStats: {
              ...state.userStats,
              xp: newXp,
              level,
              levelProgress: progress,
              hintFreeCount: newHintFreeCount,
            },
          };
        });
        get().updateStreak();
      },

      // Gamification slice
      ...createGamificationSlice(set as SliceSet, get as SliceGet, store as SliceStore),

      // Practice mode slice
      ...createPracticeModeSlice(set as SliceSet, get as SliceGet, store as SliceStore),

      // UI slice
      ...createUISlice(set as SliceSet, get as SliceGet, store as SliceStore),

      // Onboarding slice
      ...createOnboardingSlice(set as SliceSet, get as SliceGet, store as SliceStore),

      // Timer slice
      ...(createTimerSlice(set as SliceSet, get as SliceGet, store as SliceStore) as TimerSlice),

      // Reset snapshot state (stored in-store rather than module-level for SSR safety)
      _resetSnapshot: null as ProgressSnapshot | null,
      _resetSnapshotTime: 0,

      // Override setCurrentTaskId to also clear UI state
      setCurrentTaskId: (id: string | null) => {
        set({
          currentTaskId: id,
          editorContent: '',
          lastResult: null,
          hintLevel: 0,
          totalHintPenalty: 0,
          solutionVisible: false,
          verification: null,
        });
      },

      // Override startPracticeMode to coordinate with editor state
      startPracticeMode: (difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all' = 'all') => {
        let pool = TRAINING_TASKS;
        if (difficulty !== 'all') {
          pool = TRAINING_TASKS.filter((t) => t.difficulty === difficulty);
        }

        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        set({
          practiceMode: {
            active: true,
            taskOrder: shuffled.map((t) => t.id),
            currentIndex: 0,
            completedInSession: [],
          },
          currentTaskId: shuffled[0]?.id || null,
          editorContent: '',
          lastResult: null,
          verification: null,
          hintLevel: 0,
          totalHintPenalty: 0,
          solutionVisible: false,
        });
      },

      // Reset methods that affect multiple slices
      resetTaskProgress: (taskId: string) => {
        set((state) => {
          const newCompletedTasks = state.completedTasks.filter((t) => t.taskId !== taskId);
          // Recalculate XP from remaining completed tasks using difficulty-based XP
          let totalXp = 0;
          for (const ct of newCompletedTasks) {
            const task = getTaskById(ct.taskId);
            const xpBase = task?.difficulty === 'advanced' ? 30 : task?.difficulty === 'intermediate' ? 20 : 10;
            totalXp += xpBase;
          }
          const { level, progress } = calculateLevel(totalXp);
          return {
            completedTasks: newCompletedTasks,
            userStats: {
              ...state.userStats,
              xp: totalXp,
              level,
              levelProgress: progress,
            },
          };
        });
      },
      resetAllProgress: () => {
        const state = get();
        set({
          _resetSnapshot: {
            completedTasks: state.completedTasks,
            bookmarkedTasks: state.bookmarkedTasks,
            queryHistory: state.queryHistory,
            savedQueries: state.savedQueries,
            streak: state.streak,
            userStats: state.userStats,
            achievements: state.achievements,
            unlockedAchievements: state.unlockedAchievements,
          },
          _resetSnapshotTime: Date.now(),
          completedTasks: [],
          bookmarkedTasks: [],
          queryHistory: [],
          savedQueries: [],
          streak: { ...defaultStreak },
          userStats: { ...defaultStats },
          achievements: [],
          unlockedAchievements: [],
        });
      },
      undoReset: () => {
        const { _resetSnapshot: snapshot, _resetSnapshotTime: snapshotTime } = get();
        if (!snapshot || Date.now() - snapshotTime > 30_000) return;
        set({
          completedTasks: snapshot.completedTasks,
          bookmarkedTasks: snapshot.bookmarkedTasks,
          queryHistory: snapshot.queryHistory,
          savedQueries: snapshot.savedQueries,
          streak: snapshot.streak,
          userStats: snapshot.userStats,
          achievements: snapshot.achievements,
          unlockedAchievements: snapshot.unlockedAchievements,
          _resetSnapshot: null,
          _resetSnapshotTime: 0,
        });
      },

      // Export/Import
      exportProgress: () => {
        const state = get();
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          completedTasks: state.completedTasks,
          bookmarkedTasks: state.bookmarkedTasks,
          streak: state.streak,
          queryHistory: state.queryHistory,
          savedQueries: state.savedQueries,
          userStats: state.userStats,
          achievements: state.achievements,
          unlockedAchievements: state.unlockedAchievements,
        };
      },
      importProgress: (data: ExportData) => {
        if (!data || typeof data !== 'object') {
          return { success: false, error: 'Invalid data format' };
        }
        if (data.version !== 1) {
          return { success: false, error: 'Incompatible version' };
        }

        set({
          completedTasks: Array.isArray(data.completedTasks) ? data.completedTasks : [],
          bookmarkedTasks: Array.isArray(data.bookmarkedTasks) ? data.bookmarkedTasks : [],
          streak: data.streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: '',
            totalPracticeDays: 0,
          },
          queryHistory: Array.isArray(data.queryHistory) ? data.queryHistory : [],
          savedQueries: Array.isArray(data.savedQueries) ? data.savedQueries : [],
          userStats: data.userStats || {
            xp: 0,
            level: 1,
            levelProgress: 0,
            explainCount: 0,
            hintFreeCount: 0,
          },
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
          unlockedAchievements: Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements : [],
        });

        return { success: true };
      },
    }),
    {
      name: 'sql-trainer-storage',
      partialize: (state) => ({
        dbType: state.dbType,
        completedTasks: state.completedTasks,
        queryHistory: state.queryHistory,
        bookmarkedTasks: state.bookmarkedTasks,
        streak: state.streak,
        savedQueries: state.savedQueries,
        userStats: state.userStats,
        achievements: state.achievements,
        unlockedAchievements: state.unlockedAchievements,
        onboardingCompleted: state.onboardingCompleted,
      }),
    },
  ),
);
