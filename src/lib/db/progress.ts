import { getDb } from './connection';
import { logger } from '../logger';

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  tasks_completed: number;
  total_attempts: number;
}

export async function saveUserProgress(userId: string, taskId: string, attempts: number): Promise<void> {
  try {
    const db = getDb();
    const saveProgress = db.transaction(() => {
      const now = Date.now();
      db.prepare(
        'INSERT INTO user_progress (user_id, task_id, completed_at, attempts) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, task_id) DO UPDATE SET completed_at = ?, attempts = ?',
      ).run(userId, taskId, now, attempts, now, attempts);

      const user = db
        .prepare('SELECT streak_current, streak_longest, last_practice_date FROM users WHERE id = ?')
        .get(userId) as
        | { streak_current: number; streak_longest: number; last_practice_date: number | null }
        | undefined;

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayTs = todayStart.getTime();

      let newStreak = 1;
      if (user?.last_practice_date) {
        const lastPracticeDay = new Date(user.last_practice_date);
        lastPracticeDay.setHours(0, 0, 0, 0);
        const dayDiff = (todayTs - lastPracticeDay.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 0) {
          newStreak = user.streak_current || 1;
        } else if (dayDiff === 1) {
          newStreak = (user.streak_current || 0) + 1;
        }
      }

      const newLongest = Math.max(newStreak, user?.streak_longest || 0);

      db.prepare(
        'UPDATE users SET last_active = ?, last_practice_date = ?, streak_current = ?, streak_longest = ? WHERE id = ?',
      ).run(todayTs, todayTs, newStreak, newLongest, userId);
    });

    saveProgress();
  } catch (error) {
    logger.error('saveUserProgress failed:', error);
  }
}

export async function getUserProgress(
  userId: string,
): Promise<{ task_id: string; completed_at: number; attempts: number }[]> {
  try {
    const db = getDb();
    return db
      .prepare('SELECT task_id, completed_at, attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at DESC')
      .all(userId) as { task_id: string; completed_at: number; attempts: number }[];
  } catch (error) {
    logger.error('getUserProgress failed:', error);
    return [];
  }
}

export async function getUserAchievements(
  userId: string,
): Promise<{ id: string; title: string; description: string; icon: string; earned_at: number }[]> {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT a.id, a.title, a.description, a.icon, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at DESC`,
      )
      .all(userId) as { id: string; title: string; description: string; icon: string; earned_at: number }[];
  } catch (error) {
    logger.error('getUserAchievements failed:', error);
    return [];
  }
}

export async function getAchievementDetails(achievementIds: string[]) {
  try {
    const db = getDb();
    const details: { id: string; title: string; description: string; icon: string }[] = [];
    for (const id of achievementIds) {
      const row = db.prepare('SELECT id, title, description, icon FROM achievements WHERE id = ?').get(id) as
        | { id: string; title: string; description: string; icon: string }
        | undefined;
      if (row) details.push(row);
    }
    return details;
  } catch (error) {
    logger.error('getAchievementDetails failed:', error);
    return [];
  }
}

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  try {
    const db = getDb();
    const achievements = db.prepare('SELECT id, condition_type, condition_value FROM achievements').all() as {
      id: string;
      condition_type: string;
      condition_value: number;
    }[];
    const earned: string[] = [];
    const existing = db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(userId) as {
      achievement_id: string;
    }[];
    const existingIds = new Set(existing.map((e) => e.achievement_id));

    const progress = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?').get(userId) as {
      count: number;
    };
    const progressWithOneAttempt = db
      .prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND attempts = 1')
      .get(userId) as { count: number };
    const beginnerCount = db
      .prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND task_id LIKE 'beginner-%'")
      .get(userId) as { count: number };
    const intermediateCount = db
      .prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND task_id LIKE 'intermediate-%'")
      .get(userId) as { count: number };
    const advancedCount = db
      .prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND task_id LIKE 'advanced-%'")
      .get(userId) as { count: number };

    const allProgress = db
      .prepare('SELECT attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC')
      .all(userId) as { attempts: number }[];
    let maxStreak = 0;
    let currentStreak = 0;
    for (const row of allProgress) {
      if (row.attempts === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const dbTypesUsed = progress.count >= 20 ? 2 : 1;

    for (const achievement of achievements) {
      if (existingIds.has(achievement.id)) continue;

      let shouldAward = false;
      switch (achievement.condition_type) {
        case 'tasks_completed':
          shouldAward = progress.count >= achievement.condition_value;
          break;
        case 'difficulty_completed':
          if (achievement.id === 'beginner-done') shouldAward = beginnerCount.count >= achievement.condition_value;
          else if (achievement.id === 'intermediate-done')
            shouldAward = intermediateCount.count >= achievement.condition_value;
          else if (achievement.id === 'advanced-done') shouldAward = advancedCount.count >= achievement.condition_value;
          break;
        case 'single_attempt':
          shouldAward = progressWithOneAttempt.count >= 1;
          break;
        case 'streak_perfect':
          shouldAward = maxStreak >= achievement.condition_value;
          break;
        case 'db_types_used':
          shouldAward = dbTypesUsed >= achievement.condition_value;
          break;
      }

      if (shouldAward) {
        db.prepare('INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)').run(
          userId,
          achievement.id,
          Date.now(),
        );
        earned.push(achievement.id);
      }
    }

    return earned;
  } catch (error) {
    logger.error('checkAndAwardAchievements failed:', error);
    return [];
  }
}

export function getLeaderboard(limit = 50, offset = 0): LeaderboardEntry[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT u.id as user_id, u.name,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(SUM(up.attempts), 0) as total_attempts
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    GROUP BY u.id, u.name
    ORDER BY tasks_completed DESC, total_attempts ASC
    LIMIT ? OFFSET ?
  `,
    )
    .all(limit, offset) as LeaderboardEntry[];
}
