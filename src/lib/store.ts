/**
 * Zustand Store for SQL Trainer
 * Manages application state with localStorage persistence.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DbType, Difficulty } from './training-tasks';
import { TRAINING_TASKS } from './training-tasks';
import { t } from './i18n';

export interface QueryHistoryEntry {
  sql: string;
  timestamp: number;
  success: boolean;
  executionTime: number;
  rowCount?: number;
}

export interface CompletedTask {
  taskId: string;
  completedAt: number;
  attempts: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string; // ISO date string
  totalPracticeDays: number;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  completedTasks: CompletedTask[];
  bookmarkedTasks: string[];
  streak: StreakInfo;
  queryHistory: QueryHistoryEntry[];
}

export interface VerificationResult {
  verified: boolean;
  userRowCount: number;
  expectedRowCount: number;
  message: string;
}

interface SQLTrainerState {
  // Database
  dbType: DbType;
  setDbType: (type: DbType) => void;

  // Current task
  currentTaskId: string | null;
  setCurrentTaskId: (id: string | null) => void;

  // Editor
  editorContent: string;
  setEditorContent: (content: string) => void;

  // Query results
  lastResult: {
    success: boolean;
    columns: string[];
    rows: Record<string, unknown>[];
    error?: string;
    executionTime: number;
    message?: string;
    suggestion?: string;
  } | null;
  setLastResult: (result: SQLTrainerState['lastResult']) => void;

  // Verification
  verification: VerificationResult | null;
  setVerification: (result: VerificationResult | null) => void;

  // Query history
  queryHistory: QueryHistoryEntry[];
  addQueryHistory: (entry: QueryHistoryEntry) => void;
  clearHistory: () => void;

  // Training progress
  completedTasks: CompletedTask[];
  markTaskCompleted: (taskId: string, attempts: number) => void;
  isTaskCompleted: (taskId: string) => boolean;

  // Bookmarked tasks
  bookmarkedTasks: string[];
  toggleBookmark: (taskId: string) => void;
  isBookmarked: (taskId: string) => boolean;

  // Streak tracking
  streak: StreakInfo;
  updateStreak: () => void;

  // Export/Import
  exportProgress: () => ExportData;
  importProgress: (data: ExportData) => { success: boolean; error?: string };

  // Practice mode
  practiceMode: {
    active: boolean;
    taskOrder: string[];
    currentIndex: number;
    completedInSession: string[];
  };
  startPracticeMode: (difficulty?: Difficulty | 'all') => void;
  stopPracticeMode: () => void;
  nextPracticeTask: () => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  referenceOpen: boolean;
  setReferenceOpen: (open: boolean) => void;
  hintVisible: boolean;
  setHintVisible: (visible: boolean) => void;
  solutionVisible: boolean;
  setSolutionVisible: (visible: boolean) => void;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
}

export const useSQLTrainerStore = create<SQLTrainerState>()(
  persist(
    (set, get) => ({
      // Database
      dbType: 'sqlite',
      setDbType: (type) => set({ dbType: type, editorContent: '', lastResult: null, verification: null }),

      // Current task
      currentTaskId: null,
      setCurrentTaskId: (id) => set({ currentTaskId: id, editorContent: '', lastResult: null, hintVisible: false, solutionVisible: false, verification: null }),

      // Editor
      editorContent: '',
      setEditorContent: (content) => set({ editorContent: content }),

      // Query results
      lastResult: null,
      setLastResult: (result) => set({ lastResult: result }),

      // Verification
      verification: null,
      setVerification: (result) => set({ verification: result }),

      // Query history
      queryHistory: [],
      addQueryHistory: (entry) =>
        set((state) => ({
          queryHistory: [entry, ...state.queryHistory].slice(0, 50), // Keep last 50
        })),
      clearHistory: () => set({ queryHistory: [] }),

      // Training progress
      completedTasks: [],
      markTaskCompleted: (taskId, attempts) =>
        set((state) => ({
          completedTasks: [
            ...state.completedTasks.filter((t) => t.taskId !== taskId),
            { taskId, completedAt: Date.now(), attempts },
          ],
        })),
      isTaskCompleted: (taskId) => get().completedTasks.some((t) => t.taskId === taskId),

      // Bookmarked tasks
      bookmarkedTasks: [],
      toggleBookmark: (taskId) =>
        set((state) => ({
          bookmarkedTasks: state.bookmarkedTasks.includes(taskId)
            ? state.bookmarkedTasks.filter((id) => id !== taskId)
            : [...state.bookmarkedTasks, taskId],
        })),
      isBookmarked: (taskId) => get().bookmarkedTasks.includes(taskId),

      // Streak tracking
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: '',
        totalPracticeDays: 0,
      },
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const { streak } = get();

        // Already practiced today
        if (streak.lastPracticeDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newCurrentStreak = streak.currentStreak;
        if (streak.lastPracticeDate === yesterdayStr) {
          // Continue streak
          newCurrentStreak += 1;
        } else if (streak.lastPracticeDate !== today) {
          // Reset streak (missed at least one day)
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
        };
      },
      importProgress: (data: ExportData) => {
        if (!data || typeof data !== 'object') {
          return { success: false, error: t('export.error.invalidFormat') };
        }
        if (data.version !== 1) {
          return { success: false, error: t('export.error.incompatibleVersion') };
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
        });

        return { success: true };
      },

      // Practice mode
      practiceMode: {
        active: false,
        taskOrder: [],
        currentIndex: 0,
        completedInSession: [],
      },
      startPracticeMode: (difficulty = 'all') => {
        let pool = TRAINING_TASKS;
        if (difficulty !== 'all') {
          pool = TRAINING_TASKS.filter((t) => t.difficulty === difficulty);
        }

        // Shuffle tasks using Fisher-Yates algorithm
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
      stopPracticeMode: () => {
        set({
          practiceMode: {
            active: false,
            taskOrder: [],
            currentIndex: 0,
            completedInSession: [],
          },
        });
      },
      nextPracticeTask: () => {
        const { practiceMode } = get();
        if (!practiceMode.active) return;

        const nextIndex = practiceMode.currentIndex + 1;
        if (nextIndex >= practiceMode.taskOrder.length) {
          // All tasks completed in this session
          set({
            practiceMode: {
              ...practiceMode,
              active: false,
            },
          });
          return;
        }

        set({
          practiceMode: {
            ...practiceMode,
            currentIndex: nextIndex,
            completedInSession: [
              ...practiceMode.completedInSession,
              practiceMode.taskOrder[practiceMode.currentIndex],
            ],
          },
          currentTaskId: practiceMode.taskOrder[nextIndex],
          editorContent: '',
          lastResult: null,
          verification: null,
          hintVisible: false,
          solutionVisible: false,
        });
      },

      // UI state
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      referenceOpen: false,
      setReferenceOpen: (open) => set({ referenceOpen: open }),
      hintVisible: false,
      setHintVisible: (visible) => set({ hintVisible: visible }),
      solutionVisible: false,
      setSolutionVisible: (visible) => set({ solutionVisible: visible }),
      isExecuting: false,
      setIsExecuting: (executing) => set({ isExecuting: executing }),
    }),
    {
      name: 'sql-trainer-storage',
      partialize: (state) => ({
        dbType: state.dbType,
        completedTasks: state.completedTasks,
        queryHistory: state.queryHistory,
        bookmarkedTasks: state.bookmarkedTasks,
        streak: state.streak,
      }),
    }
  )
);
