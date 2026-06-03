/**
 * Database & Editor slice — manages DB type, editor content, and query results.
 */
import type { StateCreator } from 'zustand';
import type { DbType } from '@/lib/training-tasks';

export interface QueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime: number;
  message?: string;
  suggestion?: string;
}

export interface VerificationResult {
  verified: boolean;
  userRowCount: number;
  expectedRowCount: number;
  message: string;
}

export interface DatabaseSlice {
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
  lastResult: QueryResult | null;
  setLastResult: (result: QueryResult | null) => void;

  // Verification
  verification: VerificationResult | null;
  setVerification: (result: VerificationResult | null) => void;

  // Execution state
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;

  // UI state referenced by database setters
  hintVisible: boolean;
  setHintVisible: (visible: boolean) => void;
  solutionVisible: boolean;
  setSolutionVisible: (visible: boolean) => void;
}

export const createDatabaseSlice: StateCreator<DatabaseSlice, [], [], DatabaseSlice> = (set) => ({
  dbType: 'sqlite',
  setDbType: (type) => set({ dbType: type, editorContent: '', lastResult: null, verification: null }),

  currentTaskId: null,
  setCurrentTaskId: (id) =>
    set({
      currentTaskId: id,
      editorContent: '',
      lastResult: null,
      hintVisible: false,
      solutionVisible: false,
      verification: null,
    }),

  editorContent: '',
  setEditorContent: (content) => set({ editorContent: content }),

  lastResult: null,
  setLastResult: (result) => set({ lastResult: result }),

  verification: null,
  setVerification: (result) => set({ verification: result }),

  isExecuting: false,
  setIsExecuting: (executing) => set({ isExecuting: executing }),

  hintVisible: false,
  setHintVisible: (visible) => set({ hintVisible: visible }),
  solutionVisible: false,
  setSolutionVisible: (visible) => set({ solutionVisible: visible }),
});
