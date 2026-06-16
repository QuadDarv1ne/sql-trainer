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
    title: 'First Step',
    description: 'Execute your first SQL query',
    icon: '🎯',
  },
  BEGINNER_COMPLETE: {
    id: 'beginner_complete',
    title: 'Beginner',
    description: 'Complete all beginner level tasks',
    icon: '🌱',
  },
  INTERMEDIATE_COMPLETE: {
    id: 'intermediate_complete',
    title: 'Professional',
    description: 'Complete all intermediate level tasks',
    icon: '⭐',
  },
  ADVANCED_COMPLETE: {
    id: 'advanced_complete',
    title: 'Expert',
    description: 'Complete all advanced level tasks',
    icon: '🏆',
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    title: 'Perfect!',
    description: 'Solve a task on the first attempt',
    icon: '💯',
  },
  MARATHON: {
    id: 'marathon',
    title: 'Marathon',
    description: 'Solve 10 tasks in a row',
    icon: '🔥',
  },
  MASTER: {
    id: 'master',
    title: 'SQL Master',
    description: 'Complete all tasks',
    icon: '👑',
  },
  EXPLAIN_MASTER: {
    id: 'explain_master',
    title: 'Analyst',
    description: 'Use EXPLAIN 10 times',
    icon: '📊',
  },
  HISTORY_KEEPER: {
    id: 'history_keeper',
    title: 'Historian',
    description: 'Save 20 queries in history',
    icon: '📚',
  },
  STREAK_3: {
    id: 'streak_3',
    title: 'On a Roll',
    description: 'Practice streak of 3 days',
    icon: '🔥',
  },
  STREAK_5: {
    id: 'streak_5',
    title: 'Unstoppable',
    description: 'Practice streak of 5 days',
    icon: '💥',
  },
  FIRST_JOIN: {
    id: 'first_join',
    title: 'Join Master',
    description: 'Execute your first query with JOIN',
    icon: '🔗',
  },
  FIRST_WINDOW: {
    id: 'first_window',
    title: 'Window Master',
    description: 'Execute your first query with a window function',
    icon: '🪟',
  },
  FIRST_CTE: {
    id: 'first_cte',
    title: 'CTE Master',
    description: 'Execute your first query with CTE (WITH)',
    icon: '📋',
  },
  FIRST_SUBQUERY: {
    id: 'first_subquery',
    title: 'Subquery',
    description: 'Execute your first query with a subquery',
    icon: '🔍',
  },
  HINT_FREE: {
    id: 'hint_free',
    title: 'Independent',
    description: 'Solve 5 tasks without hints',
    icon: '🧠',
  },
  AGGREGATE_MASTER: {
    id: 'aggregate_master',
    title: 'Aggregator',
    description: 'Solve 10 tasks with GROUP BY and aggregate functions',
    icon: '📊',
  },
  COMPANY_COMPLETE: {
    id: 'company_complete',
    title: 'Corporate Analyst',
    description: 'Solve all tasks in the Company category',
    icon: '🏢',
  },
  SHOP_COMPLETE: {
    id: 'shop_complete',
    title: 'E-commerce Expert',
    description: 'Solve all tasks in the Shop category',
    icon: '🛒',
  },
  ANALYTICS_COMPLETE: {
    id: 'analytics_complete',
    title: 'Data Analyst',
    description: 'Solve all tasks in the Analytics category',
    icon: '📈',
  },
  STREAK_7: {
    id: 'streak_7',
    title: 'Week of Practice',
    description: 'Practice streak of 7 days',
    icon: '🔥',
  },
  STREAK_14: {
    id: 'streak_14',
    title: 'Two Weeks',
    description: 'Practice streak of 14 days',
    icon: '💎',
  },
  STREAK_30: {
    id: 'streak_30',
    title: 'Month of Practice',
    description: 'Practice streak of 30 days',
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
    currentStreak?: number;
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

export const createGamificationSlice: StateCreator<GamificationSlice, [], [], GamificationSlice> = (set, get) => ({
  userStats: defaultStats,
  addXP: (amount) => {
    const { userStats } = get();
    const newXP = userStats.xp + amount;
    const { level, progress } = calculateLevel(newXP);
    set({
      userStats: {
        ...userStats,
        xp: newXP,
        level,
        levelProgress: progress,
      },
    });
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

  checkAndUnlockAchievements: ({ completedTasks, queryHistoryLength, currentStreak, taskId, attempts }) => {
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
    const beginnerCount = TRAINING_TASKS.filter(
      (t) => t.difficulty === 'beginner' && completedTaskIds.has(t.id),
    ).length;
    const intermediateCount = TRAINING_TASKS.filter(
      (t) => t.difficulty === 'intermediate' && completedTaskIds.has(t.id),
    ).length;
    const advancedCount = TRAINING_TASKS.filter(
      (t) => t.difficulty === 'advanced' && completedTaskIds.has(t.id),
    ).length;

    if (
      beginnerCount === TRAINING_TASKS.filter((t) => t.difficulty === 'beginner').length &&
      !achievementSet.has(ACHIEVEMENTS.BEGINNER_COMPLETE.id)
    ) {
      newAchievementIds.push(ACHIEVEMENTS.BEGINNER_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.BEGINNER_COMPLETE.id);
    }

    if (
      intermediateCount === TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate').length &&
      !achievementSet.has(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id)
    ) {
      newAchievementIds.push(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.INTERMEDIATE_COMPLETE.id);
    }

    if (
      advancedCount === TRAINING_TASKS.filter((t) => t.difficulty === 'advanced').length &&
      !achievementSet.has(ACHIEVEMENTS.ADVANCED_COMPLETE.id)
    ) {
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
    const streak = currentStreak ?? 0;
    if (streak >= 3 && !achievementSet.has(ACHIEVEMENTS.STREAK_3.id)) {
      newAchievementIds.push(ACHIEVEMENTS.STREAK_3.id);
      achievementSet.add(ACHIEVEMENTS.STREAK_3.id);
    }
    if (streak >= 5 && !achievementSet.has(ACHIEVEMENTS.STREAK_5.id)) {
      newAchievementIds.push(ACHIEVEMENTS.STREAK_5.id);
      achievementSet.add(ACHIEVEMENTS.STREAK_5.id);
    }
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
      const solution = task?.sampleSolution || '';
      const solutionUpper = solution.toUpperCase();

      // First JOIN
      if (solutionUpper.includes('JOIN') && !achievementSet.has(ACHIEVEMENTS.FIRST_JOIN.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_JOIN.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_JOIN.id);
      }

      // First window function
      if (
        (solutionUpper.includes('ROW_NUMBER') ||
          solutionUpper.includes('RANK()') ||
          solutionUpper.includes('DENSE_RANK') ||
          solutionUpper.includes('LAG(') ||
          solutionUpper.includes('LEAD(') ||
          solutionUpper.includes('OVER')) &&
        !achievementSet.has(ACHIEVEMENTS.FIRST_WINDOW.id)
      ) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_WINDOW.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_WINDOW.id);
      }

      // First CTE
      if (solutionUpper.includes('WITH') && !achievementSet.has(ACHIEVEMENTS.FIRST_CTE.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_CTE.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_CTE.id);
      }

      // First subquery
      const selectCount = (solutionUpper.match(/SELECT/g) || []).length;
      if (selectCount > 1 && !achievementSet.has(ACHIEVEMENTS.FIRST_SUBQUERY.id)) {
        newAchievementIds.push(ACHIEVEMENTS.FIRST_SUBQUERY.id);
        achievementSet.add(ACHIEVEMENTS.FIRST_SUBQUERY.id);
      }

      // Aggregate master: count tasks with GROUP BY
      const aggregateTasks = completedTasks.filter((t) => {
        const sol = TRAINING_TASKS.find((tr) => tr.id === t.taskId)?.sampleSolution || '';
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

    if (
      categoryCompleted('company') === categoryTasks('company').length &&
      categoryTasks('company').length > 0 &&
      !achievementSet.has(ACHIEVEMENTS.COMPANY_COMPLETE.id)
    ) {
      newAchievementIds.push(ACHIEVEMENTS.COMPANY_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.COMPANY_COMPLETE.id);
    }
    if (
      categoryCompleted('shop') === categoryTasks('shop').length &&
      categoryTasks('shop').length > 0 &&
      !achievementSet.has(ACHIEVEMENTS.SHOP_COMPLETE.id)
    ) {
      newAchievementIds.push(ACHIEVEMENTS.SHOP_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.SHOP_COMPLETE.id);
    }
    if (
      categoryCompleted('analytics') === categoryTasks('analytics').length &&
      categoryTasks('analytics').length > 0 &&
      !achievementSet.has(ACHIEVEMENTS.ANALYTICS_COMPLETE.id)
    ) {
      newAchievementIds.push(ACHIEVEMENTS.ANALYTICS_COMPLETE.id);
      achievementSet.add(ACHIEVEMENTS.ANALYTICS_COMPLETE.id);
    }

    // Hint-free solver
    const hintFreeCount = completedTasks.filter((t) => t.attempts === 1).length;
    if (hintFreeCount >= 5 && !achievementSet.has(ACHIEVEMENTS.HINT_FREE.id)) {
      newAchievementIds.push(ACHIEVEMENTS.HINT_FREE.id);
      achievementSet.add(ACHIEVEMENTS.HINT_FREE.id);
    }

    // Explain master
    const { userStats } = get();
    if (userStats.explainCount >= 10 && !achievementSet.has(ACHIEVEMENTS.EXPLAIN_MASTER.id)) {
      newAchievementIds.push(ACHIEVEMENTS.EXPLAIN_MASTER.id);
      achievementSet.add(ACHIEVEMENTS.EXPLAIN_MASTER.id);
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
