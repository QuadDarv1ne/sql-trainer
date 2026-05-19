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
import { createProgressSlice, type ProgressSlice } from './progress-slice';
import { createGamificationSlice, type GamificationSlice, type Achievement } from './gamification-slice';
import { createPracticeModeSlice, type PracticeModeSlice } from './practice-mode-slice';
import { createUISlice, type UISlice } from './ui-slice';
import type { DbType } from '@/lib/training-tasks';
import { TRAINING_TASKS } from '@/lib/training-tasks';
import { ACHIEVEMENTS } from './gamification-slice';

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

let _resetSnapshot: ProgressSnapshot | null = null;
let _resetSnapshotTime = 0;

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
  UISlice & {
    exportProgress: () => ExportData;
    importProgress: (data: ExportData) => { success: boolean; error?: string };
    undoReset: () => void;
  };

export const useSQLTrainerStore = create<CombinedState>()(
  persist(
    (set, get) => ({
      // Database slice
      ...createDatabaseSlice(set, get as never, {} as never),

      // Override markTaskCompleted to include gamification
      markTaskCompleted: (taskId: string, attempts: number) => {
        const { checkAndUnlockAchievements, addXP, completedTasks, queryHistory } = get();

        // First update completed tasks
        set({
          completedTasks: [
            ...completedTasks.filter((t) => t.taskId !== taskId),
            { taskId, completedAt: Date.now(), attempts },
          ],
        });

        // Then handle gamification
        const updatedTasks = [
          ...completedTasks.filter((t) => t.taskId !== taskId),
          { taskId, completedAt: Date.now(), attempts },
        ];
        const { xpGained } = checkAndUnlockAchievements({
          completedTasks: updatedTasks,
          queryHistoryLength: queryHistory.length,
          taskId,
          attempts,
        });
        if (xpGained > 0) {
          addXP(xpGained);
        }
      },
      isTaskCompleted: (taskId: string) => get().completedTasks.some((t) => t.taskId === taskId),

      bookmarkedTasks: [],
      toggleBookmark: (taskId: string) =>
        set((state) => ({
          bookmarkedTasks: state.bookmarkedTasks.includes(taskId)
            ? state.bookmarkedTasks.filter((id) => id !== taskId)
            : [...state.bookmarkedTasks, taskId],
        })),
      isBookmarked: (taskId: string) => get().bookmarkedTasks.includes(taskId),

      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: '',
        totalPracticeDays: 0,
      },
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const { streak } = get();
        if (streak.lastPracticeDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newCurrentStreak = streak.currentStreak;
        if (streak.lastPracticeDate === yesterdayStr) {
          newCurrentStreak += 1;
        } else if (streak.lastPracticeDate !== today) {
          newCurrentStreak = 1;
        }

        set({
          streak: {
            currentStreak: newCurrentStreak,
            longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
            lastPracticeDate: today,
            totalPracticeDays: streak.lastPracticeDate !== today ? streak.totalPracticeDays + 1 : streak.totalPracticeDays,
          },
        });
      },

      queryHistory: [],
      addQueryHistory: (entry) =>
        set((state) => ({
          queryHistory: [entry, ...state.queryHistory].slice(0, 50),
        })),
      clearHistory: () => set({ queryHistory: [] }),

      savedQueries: [],
      saveQuery: (query) =>
        set((state) => ({
          savedQueries: [
            { ...query, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, createdAt: Date.now() },
            ...state.savedQueries,
          ].slice(0, 50),
        })),
      deleteSavedQuery: (id: string) =>
        set((state) => ({
          savedQueries: state.savedQueries.filter((q) => q.id !== id),
        })),

      // Gamification slice
      ...createGamificationSlice(set, get as never, {} as never),

      // Practice mode slice
      ...createPracticeModeSlice(set, get as never, {} as never),

      // UI slice
      ...createUISlice(set, get as never, {} as never),

      // Override setCurrentTaskId to also clear UI state
      setCurrentTaskId: (id: string | null) => {
        set({
          currentTaskId: id,
          editorContent: '',
          lastResult: null,
          hintVisible: false,
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
          hintVisible: false,
          solutionVisible: false,
        });
      },

      // Reset methods that affect multiple slices
      resetTaskProgress: (taskId: string) => {
        set((state) => ({
          completedTasks: state.completedTasks.filter((t) => t.taskId !== taskId),
        }));
      },
      resetAllProgress: () => {
        // Save snapshot for potential undo (stored in a module-level variable)
        _resetSnapshot = {
          completedTasks: get().completedTasks,
          bookmarkedTasks: get().bookmarkedTasks,
          queryHistory: get().queryHistory,
          savedQueries: get().savedQueries,
          streak: get().streak,
          userStats: get().userStats,
          achievements: get().achievements,
          unlockedAchievements: get().unlockedAchievements,
        };
        _resetSnapshotTime = Date.now();

        set({
          completedTasks: [],
          bookmarkedTasks: [],
          queryHistory: [],
          savedQueries: [],
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: '',
            totalPracticeDays: 0,
          },
          userStats: {
            xp: 0,
            level: 1,
            levelProgress: 0,
            explainCount: 0,
          },
          achievements: [],
          unlockedAchievements: [],
        });
      },
      undoReset: () => {
        if (!_resetSnapshot || Date.now() - _resetSnapshotTime > 30_000) return;
        set({
          completedTasks: _resetSnapshot.completedTasks,
          bookmarkedTasks: _resetSnapshot.bookmarkedTasks,
          queryHistory: _resetSnapshot.queryHistory,
          savedQueries: _resetSnapshot.savedQueries,
          streak: _resetSnapshot.streak,
          userStats: _resetSnapshot.userStats,
          achievements: _resetSnapshot.achievements,
          unlockedAchievements: _resetSnapshot.unlockedAchievements,
        });
        _resetSnapshot = null;
        _resetSnapshotTime = 0;
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
          return { success: false, error: 'Неверный формат данных' };
        }
        if (data.version !== 1) {
          return { success: false, error: 'Несовместимая версия' };
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
      }),
    }
  )
);
