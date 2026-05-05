/**
 * Zustand Store for SQL Trainer
 * Manages application state with localStorage persistence.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DbType, Difficulty } from './training-tasks';

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
      }),
    }
  )
);
