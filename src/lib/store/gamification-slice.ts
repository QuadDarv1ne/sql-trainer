/**
 * Gamification slice — manages XP, levels, and achievements.
 */
import type { StateCreator } from 'zustand';
import { TRAINING_TASKS } from '@/lib/training-tasks';
import { calculateLevel } from './level-calculator';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface UserStats {
  xp: number;
  level: number;
  levelProgress: number;
  explainCount: number;
  hintFreeCount: number;
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
  FIRST_JOIN: {
    id: 'first_join',
    title: 'Мастер соединений',
    description: 'Выполните первый запрос с JOIN',
    icon: '🔗',
  },
  FIRST_WINDOW: {
    id: 'first_window',
    title: 'Оконный мастер',
    description: 'Выполните первый запрос с оконной функцией',
    icon: '🪟',
  },
  FIRST_CTE: {
    id: 'first_cte',
    title: 'CTE мастер',
    description: 'Выполните первый запрос с CTE (WITH)',
    icon: '📋',
  },
  FIRST_SUBQUERY: {
    id: 'first_subquery',
    title: 'Вложенный запрос',
    description: 'Выполните первый запрос с подзапросом',
    icon: '🔍',
  },
  HINT_FREE: {
    id: 'hint_free',
    title: 'Самостоятельный',
    description: 'Решите 5 задач без подсказок',
    icon: '🧠',
  },
  AGGREGATE_MASTER: {
    id: 'aggregate_master',
    title: 'Агрегатор',
    description: 'Решите 10 задач с GROUP BY и агрегатными функциями',
    icon: '📊',
  },
  COMPANY_COMPLETE: {
    id: 'company_complete',
    title: 'Корпоративный аналитик',
    description: 'Решите все задачи категории «Компания»',
    icon: '🏢',
  },
  SHOP_COMPLETE: {
    id: 'shop_complete',
    title: 'E-commerce эксперт',
    description: 'Решите все задачи категории «Магазин»',
    icon: '🛒',
  },
  ANALYTICS_COMPLETE: {
    id: 'analytics_complete',
    title: 'Аналитик данных',
    description: 'Решите все задачи категории «Аналитика»',
    icon: '📈',
  },
  STREAK_7: {
    id: 'streak_7',
    title: 'Неделя практики',
    description: 'Серия практики 7 дней',
    icon: '🔥',
  },
  STREAK_14: {
    id: 'streak_14',
    title: 'Две недели',
    description: 'Серия практики 14 дней',
    icon: '💎',
  },
  STREAK_30: {
    id: 'streak_30',
    title: 'Месяц практики',
    description: 'Серия практики 30 дней',
    icon: '👑',
  },
} as const;

export interface GamificationSlice {
  userStats: UserStats;
  addXP: (amount: number) => void;
  calculateLevel: (totalXP: number) => { level: number; progress: number; xpToNext: number };
  incrementExplainCount: () => void;
  incrementHintFreeCount: () => void;

  achievements: string[];
  unlockedAchievements: Achievement[];
  checkAndUnlockAchievements: (context: {
    completedTasks: { taskId: string; attempts: number }[];
    queryHistoryLength: number;
    taskId?: string;
    attempts?: number;
    hintFreeCount?: number;
  }) => { newAchievements: Achievement[]; xpGained: number };

  resetGamification: () => void;
}

const defaultStats: UserStats = {
  xp: 0,
  level: 1,
  levelProgress: 0,
  explainCount: 0,
  hintFreeCount: 0,
};

export const createGamificationSlice: StateCreator<
  GamificationSlice,
  [],
  [],
  GamificationSlice
> = (set, get) => ({
  userStats: defaultStats,
  addXP: (amount) => {
    const { userStats } = get();
    const newXP = userStats.xp + amount;
    const { level, progress, xpToNext } = calculateLevel(newXP);
    set({
      userStats: {
        ...userStats,
        xp: newXP,
        level,
        levelProgress: progress,
      },
    });
    return { level, progress, xpToNext };
  },
  calculateLevel: calculateLevel,
  incrementExplainCount: () => {
    const { userStats } = get();
    set({
      userStats: {
        ...userStats,
        explainCount: userStats.explainCount + 1,
      },
    });
  },
  incrementHintFreeCount: () => {
    const { userStats } = get();
    set({
      userStats: {
        ...userStats,
        hintFreeCount: userStats.hintFreeCount + 1,
      },
    });
  },

  achievements: [],
  unlockedAchievements: [],

  checkAndUnlockAchievements: ({ completedTasks, queryHistoryLength, taskId, attempts }) => {
    const { achievements, unlockedAchievements } = get();
    const newAchievementIds: string[] = [];
    const achievementSet = new Set(achievements);

    const completedTaskIds = new Set(completedTasks.map((t) => t.taskId));
    const totalCount = completedTasks.length;

    // First query
    if (totalCount === 1 && !achievementSet.has(ACHIEVEMENTS.FIRST_QUERY.id)) {
      newAchievementIds.push(ACHIEVEMENTS.FIRST_QUERY.id);
      achievementSet.add(ACHIEVEMENTS.FIRST_QUERY.id);
    }

    // Perfect score
    if (attempts === 1 && !achievementSet.has(ACHIEVEMENTS.PERFECT_SCORE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.PERFECT_SCORE.id);
      achievementSet.add(ACHIEVEMENTS.PERFECT_SCORE.id);
    }

    // Difficulty completions
    const beginnerCount = TRAINING_TASKS.filter((t) => t.difficulty === 'beginner' && completedTaskIds.has(t.id)).length;
    const intermediateCount = TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate' && completedTaskIds.has(t.id)).length;
    const advancedCount = TRAINING_TASKS.filter((t) => t.difficulty === 'advanced' && completedTaskIds.has(t.id)).length;

    if (beginnerCount === TRAINING_TASKS.filter((t) => t.difficulty === 'beginner').length && !achievementSet.has(ACHIEVEMENTS.BEGINNER_COMPLETE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.BEGINNER_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.BEGINNER_COMPLETE.id);
    }

    if (intermediateCount === TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate').length && !achievementSet.has(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id);
    }

    if (advancedCount === TRAINING_TASKS.filter((t) => t.difficulty === 'advanced').length && !achievementSet.has(ACHIEVEMENTS.ADVANCED_COMPLETE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.ADVANCED_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.ADVANCED_COMPLETE.id);
    }

    // Master
    if (totalCount === TRAINING_TASKS.length && !achievementSet.has(ACHIEVEMENTS.MASTER.id)) {
      newAchievementIds.push(ACHIEVEMENTS.MASTER.id);
      achievementSet.add(ACHIEVEMENTS.MASTER.id);
    }

    // Marathon
    if (totalCount === 10 && !achievementSet.has(ACHIEVEMENTS.MARATHON.id)) {
      newAchievementIds.push(ACHIEVEMENTS.MARATHON.id);
      achievementSet.add(ACHIEVEMENTS.MARATHON.id);
    }

    // History keeper
    if (queryHistoryLength >= 20 && !achievementSet.has(ACHIEVEMENTS.HISTORY_KEEPER.id)) {
      newAchievementIds.push(ACHIEVEMENTS.HISTORY_KEEPER.id);
      achievementSet.add(ACHIEVEMENTS.HISTORY_KEEPER.id);
    }

    // Streak milestones
    const streak = completedTasks.length > 0 ? 3 : 0; // Placeholder — real streak comes from store
    if (streak >= 7 && !achievementSet.has(ACHIEVEMENTS.STREAK_7.id)) {
      newAchievementIds.push(ACHIEVEMENTS.STREAK_7.id);
      achievementSet.add(ACHIEVEMENTS.STREAK_7.id);
    }
    if (streak >= 14 && !achievementSet.has(ACHIEVEMENTS.STREAK_14.id)) {
      newAchievementIds.push(ACHIEVEMENTS.STREAK_14.id);
      achievementSet.add(ACHIEVEMENTS.STREAK_14.id);
    }
    if (streak >= 30 && !achievementSet.has(ACHIEVEMENTS.STREAK_30.id)) {
      newAchievementIds.push(ACHIEVEMENTS.STREAK_30.id);
      achievementSet.add(ACHIEVEMENTS.STREAK_30.id);
    }

    // Topic-specific achievements — check the completed task's SQL content
    if (taskId) {
      const task = TRAINING_TASKS.find((t) => t.id === taskId);
      const completedTask = completedTasks.find((t) => t.taskId === taskId);
      const solution = task?.sampleSolution || '';
      const solutionUpper = solution.toUpperCase();

      // First JOIN
      if (solutionUpper.includes('JOIN') && !achievementSet.has(ACHIEVEMENTS.FIRST_JOIN.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_JOIN.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_JOIN.id);
      }

      // First window function
      if ((solutionUpper.includes('ROW_NUMBER') || solutionUpper.includes('RANK()') || solutionUpper.includes('DENSE_RANK') || solutionUpper.includes('LAG(') || solutionUpper.includes('LEAD(') || solutionUpper.includes('OVER')) && !achievementSet.has(ACHIEVEMENTS.FIRST_WINDOW.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_WINDOW.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_WINDOW.id);
      }

      // First CTE
      if (solutionUpper.includes('WITH') && !achievementSet.has(ACHIEVEMENTS.FIRST_CTE.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_CTE.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_CTE.id);
      }

      // First subquery
      const openParens = (solutionUpper.match(/\(/g) || []).length;
      const selectCount = (solutionUpper.match(/SELECT/g) || []).length;
      if (selectCount > 1 && !achievementSet.has(ACHIEVEMENTS.FIRST_SUBQUERY.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_SUBQUERY.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_SUBQUERY.id);
      }

      // Aggregate master: count tasks with GROUP BY
      const aggregateTasks = completedTasks.filter((t) => {
        const sol = (t as { solution?: string }).solution || TRAINING_TASKS.find((tr) => tr.id === t.taskId)?.sampleSolution || '';
        return sol.toUpperCase().includes('GROUP BY');
      }).length;
      if (aggregateTasks >= 10 && !achievementSet.has(ACHIEVEMENTS.AGGREGATE_MASTER.id)) {
        newAchievementIds.push(ACHIEVEMENTS.AGGREGATE_MASTER.id);
        achievementSet.add(ACHIEVEMENTS.AGGREGATE_MASTER.id);
      }
    }

    // Category completions
    const categoryTasks = (cat: string) => TRAINING_TASKS.filter((t) => t.category === cat);
    const categoryCompleted = (cat: string) => categoryTasks(cat).filter((t) => completedTaskIds.has(t.id)).length;

    if (categoryCompleted('company') === categoryTasks('company').length && categoryTasks('company').length > 0 && !achievementSet.has(ACHIEVEMENTS.COMPANY_COMPLETE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.COMPANY_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.COMPANY_COMPLETE.id);
    }
    if (categoryCompleted('shop') === categoryTasks('shop').length && categoryTasks('shop').length > 0 && !achievementSet.has(ACHIEVEMENTS.SHOP_COMPLETE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.SHOP_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.SHOP_COMPLETE.id);
    }
    if (categoryCompleted('analytics') === categoryTasks('analytics').length && categoryTasks('analytics').length > 0 && !achievementSet.has(ACHIEVEMENTS.ANALYTICS_COMPLETE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.ANALYTICS_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.ANALYTICS_COMPLETE.id);
    }

    // Hint-free solver
    const hintFreeCount = completedTasks.filter((t) => t.attempts === 1).length;
    if (hintFreeCount >= 5 && !achievementSet.has(ACHIEVEMENTS.HINT_FREE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.HINT_FREE.id);
      achievementSet.add(ACHIEVEMENTS.HINT_FREE.id);
    }

    // XP for task completion
    let xpGained = 0;
    if (taskId) {
      const task = TRAINING_TASKS.find((t) => t.id === taskId);
      const xpBase = task?.difficulty === 'advanced' ? 30 : task?.difficulty === 'intermediate' ? 20 : 10;
      const xpMultiplier = attempts === 1 ? 2 : attempts !== undefined && attempts <= 3 ? 1.5 : 1;
      xpGained = Math.round(xpBase * xpMultiplier);
    }

    const newAchievements = newAchievementIds.map((id) => ({
      ...ACHIEVEMENTS[id],
      unlockedAt: Date.now(),
    }));

    if (newAchievementIds.length > 0 || xpGained > 0) {
      set({
        achievements: [...achievementSet],
        unlockedAchievements: [...unlockedAchievements, ...newAchievements],
      });
    }

    return { newAchievements, xpGained };
  },

  resetGamification: () => {
    set({
      userStats: { ...defaultStats },
      achievements: [],
      unlockedAchievements: [],
    });
  },
});
