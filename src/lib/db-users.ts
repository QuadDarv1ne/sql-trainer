/**
 * User database layer — SQLite file-based storage.
 * Re-exports from focused modules under ./db/.
 * Remaining student recommendation and skill-gap functions stay here.
 */
import fs from 'fs';
import { getDb, DB_PATH } from './db/connection';
import { TRAINING_TASKS } from './training-tasks';
import { logger } from './logger';
import { t } from './i18n';

export { getDb, DB_PATH } from './db/connection';
export { type UserRole, VALID_ROLES, type TimeRangeFilters } from './db/types';
export { logAudit } from './db/users';
export {
  createUser,
  findUserByEmail,
  verifyPassword,
  getUserById,
  findUserByIdWithHash,
  updateUser,
  updatePassword,
  createResetCode,
  verifyResetCode,
} from './db/users';
export {
  saveUserProgress,
  getUserProgress,
  getUserAchievements,
  getAchievementDetails,
  checkAndAwardAchievements,
  getLeaderboard,
} from './db/progress';
export type { LeaderboardEntry } from './db/progress';
export {
  getAllUsers,
  updateUserRole,
  updateUserDetails,
  softDeleteUser,
  deleteUser,
  restoreUser,
  banUser,
  unbanUser,
  isUserBanned,
  getBannedUsers,
  getDeletedUsers,
  bulkUpdateRole,
  bulkSoftDelete,
  getAuditTrail,
} from './db/admin';
export type { UserSummary } from './db/admin';

// User CRUD, auth, and admin functions re-exported from db/ modules above

// Reset codes, progress, achievements, leaderboard, and admin re-exported from db/ modules

// Admin functions re-exported from db/ modules

export interface StudentProgress {
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  last_active: number | null;
}

export function getTeacherStudentProgress(): StudentProgress[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT u.id as user_id, u.name, u.email,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(SUM(up.attempts), 0) as total_attempts,
           COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
           MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email
    ORDER BY tasks_completed DESC, total_attempts ASC
  `,
    )
    .all() as StudentProgress[];
}

export function getStudentProgressById(userId: string): {
  completion_rate: number;
  last_active: number | null;
  tasks_completed: number;
  avg_attempts: number;
} | null {
  const db = getDb();
  const totalTasks = TRAINING_TASKS.length;
  const row = db
    .prepare(
      `
    SELECT
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `,
    )
    .get(userId) as { tasks_completed: number; avg_attempts: number; last_active: number | null } | undefined;

  if (!row) return null;
  return {
    tasks_completed: row.tasks_completed,
    avg_attempts: row.avg_attempts,
    last_active: row.last_active,
    completion_rate: Math.round((row.tasks_completed / totalTasks) * 1000) / 10,
  };
}

export function getStudentStreak(userId: string): number {
  const db = getDb();
  const user = db.prepare('SELECT streak_current FROM users WHERE id = ?').get(userId) as
    | { streak_current: number | null }
    | undefined;
  return user?.streak_current || 0;
}

// Student-facing personalized recommendations
export interface StudentRecommendation {
  type: 'next_task' | 'review_weak' | 'practice_goal' | 'streak' | 'advance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  task_id?: string;
  task_title?: string;
  action_items: string[];
}

export function getStudentRecommendations(userId: string): StudentRecommendation[] {
  const db = getDb();
  const recommendations: StudentRecommendation[] = [];

  const user = db.prepare('SELECT name, streak_current, streak_longest FROM users WHERE id = ?').get(userId) as
    | { name: string; streak_current: number; streak_longest: number }
    | undefined;

  if (!user) return recommendations;

  const progress = db
    .prepare('SELECT task_id, attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC')
    .all(userId) as { task_id: string; attempts: number }[];

  const completedSet = new Set(progress.map((p) => p.task_id));
  const tasksCompleted = progress.length;
  const avgAttempts = progress.length > 0 ? progress.reduce((s, p) => s + p.attempts, 0) / progress.length : 0;

  // Find tasks with high attempts (struggle areas)
  const struggleTasks = progress.filter((p) => p.attempts > 3);

  // Find next uncompleted task (first in TRAINING_TASKS not yet done)
  const nextTask = TRAINING_TASKS.find((t) => !completedSet.has(t.id));

  // 1. Next task recommendation
  if (nextTask) {
    const isFirstTen = tasksCompleted < 10;
    recommendations.push({
      type: 'next_task',
      priority: 'high',
      title: isFirstTen ? t('student.recommendations.startNext') : t('student.recommendations.continueNext'),
      description: nextTask.title || nextTask.id,
      task_id: nextTask.id,
      task_title: nextTask.title,
      action_items: [isFirstTen ? t('student.recommendations.startHint') : t('student.recommendations.continueHint')],
    });
  }

  // 2. Review weak topics (tasks with high attempts)
  if (struggleTasks.length > 0) {
    const weakTaskIds = struggleTasks.map((t) => t.task_id);
    const weakTasks = db
      .prepare(
        'SELECT task_id, MAX(attempts) as max_attempts FROM user_progress WHERE user_id = ? AND task_id IN (${placeholders}) GROUP BY task_id ORDER BY max_attempts DESC LIMIT 3'.replace(
          '${placeholders}',
          weakTaskIds.map(() => '?').join(','),
        ),
      )
      .all(userId, ...weakTaskIds) as { task_id: string; max_attempts: number }[];

    recommendations.push({
      type: 'review_weak',
      priority: 'high',
      title: t('student.recommendations.reviewWeak'),
      description: t('student.recommendations.reviewWeakDesc'),
      action_items: weakTasks
        .slice(0, 3)
        .map(
          (wt) =>
            `${TRAINING_TASKS.find((t) => t.id === wt.task_id)?.title || wt.task_id} (${t('student.recommendations.attempts')}: ${wt.max_attempts})`,
        ),
    });
  }

  // 3. Practice goal encouragement
  if (tasksCompleted < 10) {
    recommendations.push({
      type: 'practice_goal',
      priority: 'medium',
      title: t('student.recommendations.practiceGoal'),
      description: t('student.recommendations.practiceGoalDesc').replace(
        '{count}',
        String(Math.max(0, 10 - tasksCompleted)),
      ),
      action_items: [t('student.recommendations.dailyPractice'), t('student.recommendations.useHints')],
    });
  } else if (tasksCompleted < TRAINING_TASKS.length * 0.5) {
    recommendations.push({
      type: 'practice_goal',
      priority: 'medium',
      title: t('student.recommendations.halfway'),
      description: t('student.recommendations.halfwayDesc')
        .replace('{completed}', String(tasksCompleted))
        .replace('{total}', String(TRAINING_TASKS.length)),
      action_items: [t('student.recommendations.focusIntermediate'), t('student.recommendations.trackProgress')],
    });
  }

  // 4. Streak encouragement
  if (user.streak_current >= 3) {
    recommendations.push({
      type: 'streak',
      priority: 'low',
      title: t('student.recommendations.streak'),
      description: t('student.recommendations.streakDesc').replace('{streak}', String(user.streak_current)),
      action_items: [t('student.recommendations.keepStreak')],
    });
  } else if (tasksCompleted > 0 && (!user.streak_current || user.streak_current === 0)) {
    recommendations.push({
      type: 'streak',
      priority: 'low',
      title: t('student.recommendations.startStreak'),
      description: t('student.recommendations.startStreakDesc'),
      action_items: [t('student.recommendations.dailyTask')],
    });
  }

  // 5. Advance encouragement (completed most tasks with low attempts)
  const completionRate = tasksCompleted / TRAINING_TASKS.length;
  if (completionRate >= 0.8 && avgAttempts < 2.5) {
    recommendations.push({
      type: 'advance',
      priority: 'medium',
      title: t('student.recommendations.advance'),
      description: t('student.recommendations.advanceDesc'),
      action_items: [t('student.recommendations.tryAdvanced'), t('student.recommendations.helpOthers')],
    });
  }

  return recommendations;
}

export interface SkillGap {
  category: string;
  tasks_total: number;
  tasks_completed: number;
  completion_pct: number;
  avg_attempts: number;
  struggle_tasks: { task_id: string; title: string; attempts: number }[];
  strength_level: 'weak' | 'developing' | 'proficient' | 'strong' | 'mastered';
}

export function getStudentSkillGap(userId: string): SkillGap[] {
  const db = getDb();
  const completedTasks = db.prepare('SELECT task_id, attempts FROM user_progress WHERE user_id = ?').all(userId) as {
    task_id: string;
    attempts: number;
  }[];

  const completedMap = new Map(completedTasks.map((t) => [t.task_id, t.attempts]));
  const categoryMap = new Map<
    string,
    {
      total: number;
      completed: number;
      totalAttempts: number;
      struggleTasks: { task_id: string; title: string; attempts: number }[];
    }
  >();

  for (const task of TRAINING_TASKS) {
    const cat = task.category || 'general';
    let entry = categoryMap.get(cat);
    if (!entry) {
      entry = { total: 0, completed: 0, totalAttempts: 0, struggleTasks: [] };
      categoryMap.set(cat, entry);
    }
    entry.total++;

    const attemptInfo = completedMap.get(task.id);
    if (attemptInfo !== undefined) {
      entry.completed++;
      entry.totalAttempts += attemptInfo;
      if (attemptInfo > 3) {
        entry.struggleTasks.push({ task_id: task.id, title: task.title, attempts: attemptInfo });
      }
    }
  }

  const result: SkillGap[] = [];
  for (const [category, data] of categoryMap) {
    const completionPct = Math.round((data.completed / data.total) * 100);
    const avgAttempts = data.completed > 0 ? Math.round((data.totalAttempts / data.completed) * 10) / 10 : 0;

    let strengthLevel: SkillGap['strength_level'];
    if (completionPct >= 90 && avgAttempts <= 1.5) strengthLevel = 'mastered';
    else if (completionPct >= 75) strengthLevel = 'strong';
    else if (completionPct >= 50) strengthLevel = 'proficient';
    else if (completionPct >= 25) strengthLevel = 'developing';
    else strengthLevel = 'weak';

    result.push({
      category,
      tasks_total: data.total,
      tasks_completed: data.completed,
      completion_pct: completionPct,
      avg_attempts: avgAttempts,
      struggle_tasks: data.struggleTasks,
      strength_level: strengthLevel,
    });
  }

  return result.sort((a, b) => a.completion_pct - b.completion_pct);
}

// Database stats for admin
export interface DBStats {
  totalUsers: number;
  studentsCount: number;
  teachersCount: number;
  adminsCount: number;
  totalCompletions: number;
  achievementsAwarded: number;
  dbSizeBytes: number;
}

export function getDBStats(): DBStats {
  const db = getDb();
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const studentsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as {
    count: number;
  };
  const teachersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as {
    count: number;
  };
  const adminsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number };
  const totalCompletions = db.prepare('SELECT COUNT(*) as count FROM user_progress').get() as { count: number };
  const achievementsAwarded = db.prepare('SELECT COUNT(*) as count FROM user_achievements').get() as { count: number };

  let dbSizeBytes = 0;
  try {
    dbSizeBytes = fs.statSync(DB_PATH()).size;
  } catch {
    // File doesn't exist yet
    logger.debug('Database file does not exist yet, size is 0');
  }

  return {
    totalUsers: totalUsers.count,
    studentsCount: studentsCount.count,
    teachersCount: teachersCount.count,
    adminsCount: adminsCount.count,
    totalCompletions: totalCompletions.count,
    achievementsAwarded: achievementsAwarded.count,
    dbSizeBytes,
  };
}

export * from './db/analytics';
// Initialize on import (delegated to db/schema.ts)
import { initDatabase } from './db/schema';
initDatabase();
