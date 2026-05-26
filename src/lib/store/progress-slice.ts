/**
 * Progress slice — manages completed tasks, bookmarks, streak, and saved queries.
 */
import type { StateCreator } from 'zustand';
export type { DbType } from '@/lib/training-tasks';

const MAX_QUERY_HISTORY = 50;
const MAX_SAVED_QUERIES = 50;

export interface CompletedTask {
  taskId: string;
  completedAt: number;
  attempts: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string;
  totalPracticeDays: number;
}

export interface SavedQuery {
  id: string;
  title: string;
  sql: string;
  taskId: string | null;
  createdAt: number;
}

export interface QueryHistoryEntry {
  sql: string;
  timestamp: number;
  success: boolean;
  executionTime: number;
  rowCount?: number;
}

export interface ProgressSlice {
  completedTasks: CompletedTask[];
  markTaskCompleted: (taskId: string, attempts: number) => void;
  isTaskCompleted: (taskId: string) => boolean;

  bookmarkedTasks: string[];
  toggleBookmark: (taskId: string) => void;
  isBookmarked: (taskId: string) => boolean;

  streak: StreakInfo;
  updateStreak: () => void;

  queryHistory: QueryHistoryEntry[];
  addQueryHistory: (entry: QueryHistoryEntry) => void;
  clearHistory: () => void;

  savedQueries: SavedQuery[];
  saveQuery: (query: Omit<SavedQuery, 'id' | 'createdAt'>) => void;
  deleteSavedQuery: (id: string) => void;

  resetTaskProgress: (taskId: string) => void;
  resetAllProgress: () => void;
}

const defaultStreak: StreakInfo = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
  totalPracticeDays: 0,
};

export const createProgressSlice: StateCreator<ProgressSlice, [], [], ProgressSlice> = (set, get) => ({
  completedTasks: [],
  markTaskCompleted: (taskId, attempts) =>
    set((state) => ({
      completedTasks: [
        ...state.completedTasks.filter((t) => t.taskId !== taskId),
        { taskId, completedAt: Date.now(), attempts },
      ],
    })),
  isTaskCompleted: (taskId) => get().completedTasks.some((t) => t.taskId === taskId),

  bookmarkedTasks: [],
  toggleBookmark: (taskId) =>
    set((state) => ({
      bookmarkedTasks: state.bookmarkedTasks.includes(taskId)
        ? state.bookmarkedTasks.filter((id) => id !== taskId)
        : [...state.bookmarkedTasks, taskId],
    })),
  isBookmarked: (taskId) => get().bookmarkedTasks.includes(taskId),

  streak: defaultStreak,
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

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);
    const newTotalDays = streak.lastPracticeDate !== today ? streak.totalPracticeDays + 1 : streak.totalPracticeDays;

    set({
      streak: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastPracticeDate: today,
        totalPracticeDays: newTotalDays,
      },
    });
  },

  queryHistory: [],
  addQueryHistory: (entry) =>
    set((state) => ({
      queryHistory: [entry, ...state.queryHistory].slice(0, MAX_QUERY_HISTORY),
    })),
  clearHistory: () => set({ queryHistory: [] }),

  savedQueries: [],
  saveQuery: (query) =>
    set((state) => ({
      savedQueries: [
        { ...query, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, createdAt: Date.now() },
        ...state.savedQueries,
      ].slice(0, MAX_SAVED_QUERIES),
    })),
  deleteSavedQuery: (id) =>
    set((state) => ({
      savedQueries: state.savedQueries.filter((q) => q.id !== id),
    })),

  resetTaskProgress: (taskId) => {
    set((state) => ({
      completedTasks: state.completedTasks.filter((t) => t.taskId !== taskId),
    }));
  },
  resetAllProgress: () => {
    set({
      completedTasks: [],
      bookmarkedTasks: [],
      queryHistory: [],
      savedQueries: [],
      streak: { ...defaultStreak },
    });
  },
});
