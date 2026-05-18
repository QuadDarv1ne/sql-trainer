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

export interface UserStats {
  xp: number;
  level: number;
  levelProgress: number;
  explainCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Record<string, Omit<Achievement, 'unlockedAt'>> = {
  FIRST_QUERY: {
    id: 'first_query',
    title: 'Первый шаг',
    description: 'Выполните первый SQL запрос',
    icon: '🎯',
  },
  BEGINNER_COMPLETE: {
    id: 'beginner_complete',
    title: 'Новичок',
    description: 'Завершите все задачи начального уровня',
    icon: '🌱',
  },
  INTERMEDIATE_COMPLETE: {
    id: 'intermediate_complete',
    title: 'Профессионал',
    description: 'Завершите все задачи среднего уровня',
    icon: '⭐',
  },
  ADVANCED_COMPLETE: {
    id: 'advanced_complete',
    title: 'Эксперт',
    description: 'Завершите все задачи продвинутого уровня',
    icon: '🏆',
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    title: 'Идеально!',
    description: 'Решите задачу с первой попытки',
    icon: '💯',
  },
  MARATHON: {
    id: 'marathon',
    title: 'Марафон',
    description: 'Решите 10 задач подряд',
    icon: '🔥',
  },
  MASTER: {
    id: 'master',
    title: 'Мастер SQL',
    description: 'Завершите все задачи',
    icon: '👑',
  },
  EXPLAIN_MASTER: {
    id: 'explain_master',
    title: 'Аналитик',
    description: 'Используйте EXPLAIN 10 раз',
    icon: '📊',
  },
  HISTORY_KEEPER: {
    id: 'history_keeper',
    title: 'Хранитель',
    description: 'Сохраните 20 запросов в истории',
    icon: '📚',
  },
  STREAK_3: {
    id: 'streak_3',
    title: 'На ходу',
    description: 'Серия практики 3 дня',
    icon: '🔥',
  },
  STREAK_5: {
    id: 'streak_5',
    title: 'Неостановимый',
    description: 'Серия практики 5 дней',
    icon: '💥',
  },
} as const;

export interface SavedQuery {
  id: string;
  title: string;
  sql: string;
  taskId: string | null;
  createdAt: number;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  completedTasks: CompletedTask[];
  bookmarkedTasks: string[];
  streak: StreakInfo;
  queryHistory: QueryHistoryEntry[];
  savedQueries: SavedQuery[];
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

  // XP and levels
  userStats: UserStats;
  addXP: (amount: number) => void;
  calculateLevel: (totalXP: number) => { level: number; progress: number; xpToNext: number };
  incrementExplainCount: () => void;

  // Achievements
  achievements: string[];
  unlockedAchievements: Achievement[];

  // Reset progress
  resetTaskProgress: (taskId: string) => void;
  resetAllProgress: () => void;

  // Export/Import
  exportProgress: () => ExportData;
  importProgress: (data: ExportData) => { success: boolean; error?: string };

  // Saved queries
  savedQueries: SavedQuery[];
  saveQuery: (query: Omit<SavedQuery, 'id' | 'createdAt'>) => void;
  deleteSavedQuery: (id: string) => void;

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
        set((state) => {
          const { completedTasks, achievements, unlockedAchievements, queryHistory, userStats } = state;

          const newAchievementIds: string[] = [];
          const achievementSet = new Set(achievements);

          // Count tasks by difficulty (including current)
          const currentTasks = completedTasks.filter((t) => t.taskId !== taskId);
          const beginnerCount = currentTasks.filter((t) => t.taskId.startsWith('beginner-')).length + (taskId.startsWith('beginner-') ? 1 : 0);
          const intermediateCount = currentTasks.filter((t) => t.taskId.startsWith('intermediate-')).length + (taskId.startsWith('intermediate-') ? 1 : 0);
          const advancedCount = currentTasks.filter((t) => t.taskId.startsWith('advanced-')).length + (taskId.startsWith('advanced-') ? 1 : 0);
          const totalCount = currentTasks.length + 1;

          // Check achievements
          if (completedTasks.length === 0 && !achievementSet.has(ACHIEVEMENTS.FIRST_QUERY.id)) {
            newAchievementIds.push(ACHIEVEMENTS.FIRST_QUERY.id);
            achievementSet.add(ACHIEVEMENTS.FIRST_QUERY.id);
          }

          if (attempts === 1 && !achievementSet.has(ACHIEVEMENTS.PERFECT_SCORE.id)) {
            newAchievementIds.push(ACHIEVEMENTS.PERFECT_SCORE.id);
            achievementSet.add(ACHIEVEMENTS.PERFECT_SCORE.id);
          }

          const beginnerTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'beginner').length;
          if (beginnerCount === beginnerTotal && !achievementSet.has(ACHIEVEMENTS.BEGINNER_COMPLETE.id)) {
            newAchievementIds.push(ACHIEVEMENTS.BEGINNER_COMPLETE.id);
            achievementSet.add(ACHIEVEMENTS.BEGINNER_COMPLETE.id);
          }

          const intermediateTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate').length;
          if (intermediateCount === intermediateTotal && !achievementSet.has(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id)) {
            newAchievementIds.push(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id);
            achievementSet.add(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id);
          }

          const advancedTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'advanced').length;
          if (advancedCount === advancedTotal && !achievementSet.has(ACHIEVEMENTS.ADVANCED_COMPLETE.id)) {
            newAchievementIds.push(ACHIEVEMENTS.ADVANCED_COMPLETE.id);
            achievementSet.add(ACHIEVEMENTS.ADVANCED_COMPLETE.id);
          }

          if (totalCount === TRAINING_TASKS.length && !achievementSet.has(ACHIEVEMENTS.MASTER.id)) {
            newAchievementIds.push(ACHIEVEMENTS.MASTER.id);
            achievementSet.add(ACHIEVEMENTS.MASTER.id);
          }

          if (totalCount === 10 && !achievementSet.has(ACHIEVEMENTS.MARATHON.id)) {
            newAchievementIds.push(ACHIEVEMENTS.MARATHON.id);
            achievementSet.add(ACHIEVEMENTS.MARATHON.id);
          }

          if (queryHistory.length >= 20 && !achievementSet.has(ACHIEVEMENTS.HISTORY_KEEPER.id)) {
            newAchievementIds.push(ACHIEVEMENTS.HISTORY_KEEPER.id);
            achievementSet.add(ACHIEVEMENTS.HISTORY_KEEPER.id);
          }

          // Calculate XP based on difficulty and attempts
          const task = TRAINING_TASKS.find((t) => t.id === taskId);
          const xpBase = task?.difficulty === 'advanced' ? 30 : task?.difficulty === 'intermediate' ? 20 : 10;
          const xpMultiplier = attempts === 1 ? 2 : attempts <= 3 ? 1.5 : 1;
          const xpGained = Math.round(xpBase * xpMultiplier);

          const newXP = userStats.xp + xpGained;
          const { level, progress } = get().calculateLevel(newXP);

          const newAchievements = newAchievementIds.map((id) => ({
            ...ACHIEVEMENTS[id],
            unlockedAt: Date.now(),
          }));

          return {
            completedTasks: [
              ...currentTasks,
              { taskId, completedAt: Date.now(), attempts },
            ],
            achievements: [...achievementSet],
            unlockedAchievements: [...unlockedAchievements, ...newAchievements],
            userStats: {
              ...userStats,
              xp: newXP,
              level,
              levelProgress: progress,
            },
          };
        }),
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
          savedQueries: state.savedQueries,
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
          savedQueries: Array.isArray(data.savedQueries) ? data.savedQueries : [],
        });

        return { success: true };
      },

      // Saved queries
      savedQueries: [],
      saveQuery: (query) =>
        set((state) => ({
          savedQueries: [
            { ...query, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, createdAt: Date.now() },
            ...state.savedQueries,
          ].slice(0, 50),
        })),
      deleteSavedQuery: (id) =>
        set((state) => ({
          savedQueries: state.savedQueries.filter((q) => q.id !== id),
        })),

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
        savedQueries: state.savedQueries,
      }),
    }
  )
);
