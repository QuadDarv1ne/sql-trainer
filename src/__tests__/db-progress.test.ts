import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const TEST_DB_PATH = path.join(process.cwd(), 'data', `test-db-progress-${crypto.randomUUID().slice(0, 8)}.db`);

describe('db/progress module', () => {
  beforeAll(async () => {
    process.env.DATABASE_PATH = TEST_DB_PATH;
    const { initDatabase } = await import('@/lib/db/schema');
    initDatabase();
  });

  afterAll(async () => {
    delete process.env.DATABASE_PATH;
    try {
      const { getDb } = await import('@/lib/db/connection');
      getDb().close();
    } catch {
      // ignore
    }
    try {
      fs.unlinkSync(TEST_DB_PATH);
      fs.unlinkSync(TEST_DB_PATH + '-wal');
      fs.unlinkSync(TEST_DB_PATH + '-shm');
    } catch {
      // ignore
    }
  });

  async function createAndCompleteTask(email: string, taskId: string, attempts: number) {
    const { createUser } = await import('@/lib/db/users');
    const user = await createUser(email, 'Progress Test', 'pass123');
    const { saveUserProgress } = await import('@/lib/db/progress');
    await saveUserProgress(user!.id, taskId, attempts);
    return user!;
  }

  it('saveUserProgress saves progress', { timeout: 15000 }, async () => {
    const user = await createAndCompleteTask('progress1@example.com', 'beginner-1', 3);
    const { getUserProgress } = await import('@/lib/db/progress');
    const progress = await getUserProgress(user.id);
    expect(progress.length).toBe(1);
    expect(progress[0].task_id).toBe('beginner-1');
    expect(progress[0].attempts).toBe(3);
  });

  it('saveUserProgress updates existing progress', async () => {
    const user = await createAndCompleteTask('progress2@example.com', 'beginner-2', 5);
    const { saveUserProgress, getUserProgress } = await import('@/lib/db/progress');
    await saveUserProgress(user.id, 'beginner-2', 2);
    const progress = await getUserProgress(user.id);
    expect(progress.length).toBe(1);
    expect(progress[0].attempts).toBe(2);
  });

  it('getUserProgress returns empty for no progress', async () => {
    const { createUser } = await import('@/lib/db/users');
    const user = await createUser('noprogress@example.com', 'No Progress', 'pass123');
    const { getUserProgress } = await import('@/lib/db/progress');
    const progress = await getUserProgress(user!.id);
    expect(progress.length).toBe(0);
  });

  it('getLeaderboard returns entries', async () => {
    await createAndCompleteTask('leader1@example.com', 'beginner-1', 1);
    await createAndCompleteTask('leader2@example.com', 'beginner-2', 2);
    const { getLeaderboard } = await import('@/lib/db/progress');
    const board = getLeaderboard(10);
    expect(Array.isArray(board)).toBe(true);
    expect(board.length).toBeGreaterThan(0);
  });

  it('checkAndAwardAchievements awards first-query achievement', async () => {
    const user = await createAndCompleteTask('achievement@example.com', 'beginner-1', 1);
    const { checkAndAwardAchievements } = await import('@/lib/db/progress');
    const earned = await checkAndAwardAchievements(user.id);
    expect(earned).toContain('first-query');
  });

  it('checkAndAwardAchievements does not re-award', async () => {
    const user = await createAndCompleteTask('noexpiry@example.com', 'beginner-1', 1);
    const { checkAndAwardAchievements } = await import('@/lib/db/progress');
    await checkAndAwardAchievements(user.id);
    const earned2 = await checkAndAwardAchievements(user.id);
    expect(earned2).not.toContain('first-query');
  });

  it('getUserAchievements returns earned achievements', async () => {
    const user = await createAndCompleteTask('myachs@example.com', 'beginner-1', 1);
    const { checkAndAwardAchievements, getUserAchievements } = await import('@/lib/db/progress');
    await checkAndAwardAchievements(user.id);
    const achs = await getUserAchievements(user.id);
    expect(achs.length).toBeGreaterThan(0);
    expect(achs.some((a) => a.title === 'First Query')).toBe(true);
  });

  it('getAchievementDetails returns details for ids', async () => {
    const { getAchievementDetails } = await import('@/lib/db/progress');
    const details = await getAchievementDetails(['first-query', 'persistent']);
    expect(details.length).toBe(2);
  });

  it('checkAndAwardAchievements awards persistent at 10 tasks', async () => {
    const user = await createAndCompleteTask('persistent@example.com', 'beginner-1', 1);
    const { saveUserProgress, checkAndAwardAchievements } = await import('@/lib/db/progress');
    for (let i = 2; i <= 10; i++) {
      await saveUserProgress(user.id, `beginner-${i}`, 1);
    }
    const earned = await checkAndAwardAchievements(user.id);
    expect(earned).toContain('persistent');
  });
});
