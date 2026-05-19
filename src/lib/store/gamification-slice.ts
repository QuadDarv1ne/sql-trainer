/**
 * Gamification slice — manages XP, levels, and achievements.
 */
import type { StateCreator } from 'zustand';
import { TRAINING_TASKS } from '@/lib/training-tasks';

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

export interface GamificationSlice {
  userStats: UserStats;
  addXP: (amount: number) => void;
  calculateLevel: (totalXP: number) => { level: number; progress: number; xpToNext: number };
  incrementExplainCount: () => void;

  achievements: string[];
  unlockedAchievements: Achievement[];
  checkAndUnlockAchievements: (context: {
    completedTasks: { taskId: string; attempts: number }[];
    queryHistoryLength: number;
    taskId?: string;
    attempts?: number;
  }) => { newAchievements: Achievement[]; xpGained: number };

  resetGamification: () => void;
}

const defaultStats: UserStats = {
  xp: 0,
  level: 1,
  levelProgress: 0,
  explainCount: 0,
};

function calculateLevelFn(totalXP: number) {
  let level = 1;
  let xpNeeded = 100;
  let cumulativeXP = 0;

  while (totalXP >= cumulativeXP + xpNeeded && level < 20) {
    cumulativeXP += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }

  const remainingXP = totalXP - cumulativeXP;
  const progress = Math.round((remainingXP / xpNeeded) * 100);
  const xpToNext = xpNeeded - remainingXP;

  return { level, progress, xpToNext };
}

export const createGamificationSlice: StateCreator<GamificationSlice, [], [], GamificationSlice> = (set, get) => ({
  userStats: defaultStats,
  addXP: (amount) => {
    const { userStats } = get();
    const newXP = userStats.xp + amount;
    const { level, progress, xpToNext } = calculateLevelFn(newXP);
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
  calculateLevel: calculateLevelFn,
  incrementExplainCount: () => {
    const { userStats } = get();
    set({
      userStats: {
        ...userStats,
        explainCount: userStats.explainCount + 1,
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
