/**
 * User database layer — SQLite file-based storage.
 * Separate from the in-memory training database.
 * Uses a singleton connection to avoid SQLITE_BUSY during concurrent access.
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { TRAINING_TASKS } from './training-tasks';
import { t } from './i18n';

export type UserRole = 'student' | 'teacher' | 'admin';
const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

export interface TimeRangeFilters {
  start_date?: number;
  end_date?: number;
}

const DB_PATH = path.join(process.cwd(), 'data', 'users.db');

// Singleton connection — reused across all calls to avoid SQLITE_BUSY
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH, {
    timeout: 5000, // Wait up to 5s if DB is locked
  });
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('busy_timeout = 5000');

  return _db;
}

// Export for direct access when needed (e.g., account deletion)
export { getDb };

function initDatabase(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Soft delete migration
    ALTER TABLE users ADD COLUMN deleted_at INTEGER DEFAULT NULL;

    CREATE TABLE IF NOT EXISTS reset_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL,
      completed_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      PRIMARY KEY (user_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deadlines (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_type TEXT NOT NULL DEFAULT 'all_students',
      target_id TEXT,
      task_id TEXT,
      due_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used INTEGER,
      UNIQUE(user_id, endpoint)
    );

    CREATE TABLE IF NOT EXISTS reminder_log (
      id TEXT PRIMARY KEY,
      deadline_id TEXT REFERENCES deadlines(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      channel TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      error TEXT,
      UNIQUE(deadline_id, user_id, channel)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      channels_enabled TEXT NOT NULL DEFAULT '["in_app"]',
      reminder_intervals TEXT NOT NULL DEFAULT '[86400000,3600000]',
      teacher_notify_students INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_schedule (
      id TEXT PRIMARY KEY,
      deadline_id TEXT NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      channel TEXT NOT NULL,
      trigger_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at INTEGER,
      error TEXT,
      UNIQUE(deadline_id, user_id, channel, trigger_at)
    );

    CREATE TABLE IF NOT EXISTS email_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      error TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  // Migration: add role column if it doesn't exist (for existing databases)
  const columns = db.pragma("table_info(users)") as { name: string }[];
  const hasRole = columns.some(c => c.name === 'role');
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
  }

  // Migration: add last_active column if it doesn't exist
  const hasLastActive = columns.some(c => c.name === 'last_active');
  if (!hasLastActive) {
    db.exec("ALTER TABLE users ADD COLUMN last_active INTEGER");
  }

  // Migration: add hint_usage table for tracking hint reveals
  const tables = db.pragma("table_list") as { name: string }[];
  const hasHintUsage = tables.some(t => t.name === 'hint_usage');
  if (!hasHintUsage) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS hint_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        task_id TEXT NOT NULL,
        revealed_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_hint_usage_task ON hint_usage(task_id);
      CREATE INDEX IF NOT EXISTS idx_hint_usage_user ON hint_usage(user_id);
    `);
  }

  // Migration: add streak columns to users table
  const userColumns = db.pragma("table_info(users)") as { name: string }[];
  if (!userColumns.some(c => c.name === 'streak_current')) {
    db.exec("ALTER TABLE users ADD COLUMN streak_current INTEGER NOT NULL DEFAULT 0");
  }
  if (!userColumns.some(c => c.name === 'streak_longest')) {
    db.exec("ALTER TABLE users ADD COLUMN streak_longest INTEGER NOT NULL DEFAULT 0");
  }
  if (!userColumns.some(c => c.name === 'last_practice_date')) {
    db.exec("ALTER TABLE users ADD COLUMN last_practice_date INTEGER");
  }

  // Migration: add performance indexes for analytics queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_progress_completed_at ON user_progress(completed_at);
    CREATE INDEX IF NOT EXISTS idx_progress_task_id ON user_progress(task_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
  `);

  seedAchievements(db);
}

const ACHIEVEMENTS = [
  { id: 'first-query', title: 'Первый запрос', description: 'Выполните первое задание', icon: 'Play', conditionType: 'tasks_completed', conditionValue: 1 },
  { id: 'beginner-done', title: 'Основы SQL', description: 'Выполните все задания уровня «Начальный»', icon: 'Award', conditionType: 'difficulty_completed', conditionValue: 8 },
  { id: 'intermediate-done', title: 'Продвинутые запросы', description: 'Выполните все задания уровня «Средний»', icon: 'Star', conditionType: 'difficulty_completed', conditionValue: 23 },
  { id: 'advanced-done', title: 'Мастер SQL', description: 'Выполните все задания уровня «Продвинутый»', icon: 'Crown', conditionType: 'difficulty_completed', conditionValue: 25 },
  { id: 'all-complete', title: 'Все задания', description: 'Выполните все 56 заданий', icon: 'Trophy', conditionType: 'tasks_completed', conditionValue: 56 },
  { id: 'speed-demon', title: 'Быстрый ум', description: 'Выполните задание с первой попытки', icon: 'Zap', conditionType: 'single_attempt', conditionValue: 1 },
  { id: 'persistent', title: 'Упорство', description: 'Выполните 10 заданий', icon: 'Flame', conditionType: 'tasks_completed', conditionValue: 10 },
  { id: 'streak-3', title: 'Серия 3', description: 'Выполните 3 задания подряд с первой попытки', icon: 'Target', conditionType: 'streak_perfect', conditionValue: 3 },
  { id: 'streak-5', title: 'Серия 5', description: 'Выполните 5 заданий подряд с первой попытки', icon: 'Shield', conditionType: 'streak_perfect', conditionValue: 5 },
  { id: 'explorer', title: 'Исследователь', description: 'Попробуйте и SQLite, и PostgreSQL', icon: 'Compass', conditionType: 'db_types_used', conditionValue: 2 },
];

function seedAchievements(db: Database.Database): void {
  const insert = db.prepare('INSERT OR IGNORE INTO achievements (id, title, description, icon, condition_type, condition_value) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMany = db.transaction((achievements: typeof ACHIEVEMENTS) => {
    for (const a of achievements) {
      insert.run(a.id, a.title, a.description, a.icon, a.conditionType, a.conditionValue);
    }
  });
  try {
    insertMany(ACHIEVEMENTS);
  } catch {
    // Race condition during parallel build — achievements already seeded
  }
}

// User CRUD
export async function createUser(email: string, name: string, password: string, phone?: string, role: UserRole = 'student', actorId?: string): Promise<{ id: string; email: string; name: string; phone: string | null; role: UserRole } | null> {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return null;

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const hash = await bcrypt.hash(password, 12);

  db.prepare('INSERT INTO users (id, email, name, password_hash, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, email, name, hash, phone || null, role, now, now
  );

  if (actorId) {
    logAudit(actorId, 'user_created', 'user', id, JSON.stringify({ email, name, role }));
  }

  return { id, email, name, phone: phone || null, role };
}

export async function findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; phone: string | null; password_hash: string; role: UserRole } | null> {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, phone, password_hash, role FROM users WHERE email = ?').get(email) as
    | { id: string; email: string; name: string; phone: string | null; password_hash: string; role: UserRole }
    | undefined;
  return user || null;
}

export async function verifyPassword(email: string, password: string): Promise<{ id: string; email: string; name: string; phone: string | null; role: UserRole } | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
}

export async function getUserById(userId: string): Promise<{ id: string; email: string; name: string; phone: string | null; avatar_url: string | null; role: UserRole; created_at: number } | null> {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, phone, avatar_url, role, created_at FROM users WHERE id = ?').get(userId) as
    | { id: string; email: string; name: string; phone: string | null; avatar_url: string | null; role: UserRole; created_at: number }
    | undefined;
  return user || null;
}

export async function findUserByIdWithHash(userId: string): Promise<{ id: string; email: string; name: string; phone: string | null; password_hash: string; role: UserRole } | null> {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, phone, password_hash, role FROM users WHERE id = ?').get(userId) as
    | { id: string; email: string; name: string; phone: string | null; password_hash: string; role: UserRole }
    | undefined;
  return user || null;
}

export async function updateUser(userId: string, data: { name?: string; phone?: string; avatar_url?: string; email?: string }): Promise<boolean> {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(data.avatar_url); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }

  if (fields.length === 0) return false;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(userId);

  const result = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  const db = getDb();
  const hash = await bcrypt.hash(newPassword, 12);
  const result = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, Date.now(), userId);
  return result.changes > 0;
}

// Reset codes
export async function createResetCode(userId: string, type: 'email' | 'phone'): Promise<string> {
  const db = getDb();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  db.prepare('INSERT INTO reset_codes (id, user_id, code, type, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)').run(
    id, userId, code, type, expiresAt
  );

  return code;
}

export async function verifyResetCode(code: string): Promise<{ userId: string; type: string } | null> {
  const db = getDb();
  const now = Date.now();

  // Atomic UPDATE with WHERE clause prevents race condition where concurrent requests could both pass the used===0 check
  const result = db.prepare(
    'UPDATE reset_codes SET used = 1 WHERE code = ? AND used = 0 AND expires_at > ?'
  ).run(code, now);

  if (result.changes === 0) return null;

  const record = db.prepare(
    'SELECT user_id, type FROM reset_codes WHERE code = ?'
  ).get(code) as { user_id: string; type: string } | undefined;

  return record ? { userId: record.user_id, type: record.type } : null;
}

// Progress
export async function saveUserProgress(userId: string, taskId: string, attempts: number): Promise<void> {
  const db = getDb();
  const saveProgress = db.transaction(() => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO user_progress (user_id, task_id, completed_at, attempts) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, task_id) DO UPDATE SET completed_at = ?, attempts = ?'
    ).run(userId, taskId, now, attempts, now, attempts);

    // Calculate daily streak
    const user = db.prepare(
      'SELECT streak_current, streak_longest, last_practice_date FROM users WHERE id = ?'
    ).get(userId) as { streak_current: number; streak_longest: number; last_practice_date: number | null } | undefined;

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();

    let newStreak = 1;
    if (user?.last_practice_date) {
      const lastPracticeDay = new Date(user.last_practice_date);
      lastPracticeDay.setHours(0, 0, 0, 0);
      const dayDiff = (todayTs - lastPracticeDay.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 0) {
        // Same day — keep current streak
        newStreak = user.streak_current || 1;
      } else if (dayDiff === 1) {
        // Consecutive day — increment streak
        newStreak = (user.streak_current || 0) + 1;
      }
      // else: gap > 1 day, reset to 1
    }

    const newLongest = Math.max(newStreak, user?.streak_longest || 0);

    db.prepare(
      'UPDATE users SET last_active = ?, last_practice_date = ?, streak_current = ?, streak_longest = ? WHERE id = ?'
    ).run(todayTs, todayTs, newStreak, newLongest, userId);
  });

  saveProgress();
}

export async function getUserProgress(userId: string): Promise<{ task_id: string; completed_at: number; attempts: number }[]> {
  const db = getDb();
  return db.prepare('SELECT task_id, completed_at, attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at DESC').all(userId) as
    { task_id: string; completed_at: number; attempts: number }[];
}

// Achievements
export async function getUserAchievements(userId: string): Promise<{ id: string; title: string; description: string; icon: string; earned_at: number }[]> {
  const db = getDb();
  return db.prepare(`
    SELECT a.id, a.title, a.description, a.icon, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at DESC
  `).all(userId) as { id: string; title: string; description: string; icon: string; earned_at: number }[];
}

export async function getAchievementDetails(achievementIds: string[]) {
  const db = getDb();
  const details: { id: string; title: string; description: string; icon: string }[] = [];
  for (const id of achievementIds) {
    const row = db.prepare('SELECT id, title, description, icon FROM achievements WHERE id = ?').get(id) as
      { id: string; title: string; description: string; icon: string } | undefined;
    if (row) details.push(row);
  }
  return details;
}

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const db = getDb();
  const achievements = db.prepare('SELECT id, condition_type, condition_value FROM achievements').all() as
    { id: string; condition_type: string; condition_value: number }[];
  const earned: string[] = [];
  const existing = db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(userId) as { achievement_id: string }[];
  const existingIds = new Set(existing.map(e => e.achievement_id));

  const progress = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?').get(userId) as { count: number };
  const progressWithOneAttempt = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND attempts = 1').get(userId) as { count: number };
  const beginnerCount = db.prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND task_id LIKE 'beginner-%'").get(userId) as { count: number };
  const intermediateCount = db.prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND task_id LIKE 'intermediate-%'").get(userId) as { count: number };
  const advancedCount = db.prepare("SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND task_id LIKE 'advanced-%'").get(userId) as { count: number };

  // Calculate max streak of first-attempt completions
  const allProgress = db.prepare('SELECT attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC').all(userId) as { attempts: number }[];
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

  // Count distinct DB types used.
  // Note: All training tasks are SQLite; the DB type toggle is client-side (Zustand store).
  // Until client-side DB type usage is synced to the server, use a task-count proxy.
  const dbTypesUsed = progress.count >= 20 ? 2 : 1;

  for (const achievement of achievements) {
    if (existingIds.has(achievement.id)) continue;

    let shouldAward = false;
    switch (achievement.condition_type) {
      case 'tasks_completed':
        shouldAward = progress.count >= achievement.condition_value;
        break;
      case 'difficulty_completed':
        // Map condition_value to actual difficulty counts
        if (achievement.id === 'beginner-done') shouldAward = beginnerCount.count >= achievement.condition_value;
        else if (achievement.id === 'intermediate-done') shouldAward = intermediateCount.count >= achievement.condition_value;
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
        userId, achievement.id, Date.now()
      );
      earned.push(achievement.id);
    }
  }

  return earned;
}

// Leaderboard
export interface LeaderboardEntry {
  user_id: string;
  name: string;
  tasks_completed: number;
  total_attempts: number;
}

export function getLeaderboard(limit = 50, offset = 0): LeaderboardEntry[] {
  const db = getDb();
  return db.prepare(`
    SELECT u.id as user_id, u.name,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(SUM(up.attempts), 0) as total_attempts
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    GROUP BY u.id, u.name
    ORDER BY tasks_completed DESC, total_attempts ASC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as LeaderboardEntry[];
}

// Admin functions
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: number;
  tasks_completed: number;
  last_active: number | null;
  avg_attempts: number | null;
  achievements_count: number | null;
}

export function getAllUsers(): UserSummary[] {
  const db = getDb();
  return db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_active,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
           (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_active
    ORDER BY u.created_at DESC
  `).all() as UserSummary[];
}

export function updateUserRole(userId: string, role: UserRole, actorId?: string): boolean {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const db = getDb();
  const result = db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(role, Date.now(), userId);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'role_changed', 'user', userId, JSON.stringify({ role }));
  }
  return result.changes > 0;
}

/** Update user details (name, email, phone) — returns true if user was updated */
export function updateUserDetails(userId: string, updates: { name?: string; email?: string; phone?: string | null }, actorId?: string): boolean {
  const db = getDb();
  const parts: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) { parts.push('name = ?'); values.push(updates.name); }
  if (updates.email !== undefined) { parts.push('email = ?'); values.push(updates.email); }
  if (updates.phone !== undefined) { parts.push('phone = ?'); values.push(updates.phone || null); }

  if (parts.length === 0) return false;

  parts.push('updated_at = ?');
  values.push(Date.now());
  values.push(userId);

  const sql = `UPDATE users SET ${parts.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  const result = db.prepare(sql).run(...values);

  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'user_updated', 'user', userId, JSON.stringify(updates));
  }
  return result.changes > 0;
}

/** Soft delete — marks user as deleted without removing data */
export function softDeleteUser(userId: string, actorId?: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(Date.now(), Date.now(), userId);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'soft_delete', 'user', userId);
  }
  return result.changes > 0;
}

/** Hard delete — permanently removes user and all related data */
export function deleteUser(userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return result.changes > 0;
}

/** Restore a soft-deleted user */
export function restoreUser(userId: string, actorId?: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE users SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL').run(Date.now(), userId);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'restore_user', 'user', userId);
  }
  return result.changes > 0;
}

/** Get soft-deleted users for admin panel */
export function getDeletedUsers(): { id: string; name: string; email: string; role: UserRole; deleted_at: number; created_at: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, email, role, deleted_at, created_at
    FROM users
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
  `).all() as { id: string; name: string; email: string; role: UserRole; deleted_at: number; created_at: number }[];
}

/** Bulk role update */
export function bulkUpdateRole(userIds: string[], role: UserRole, actorId?: string): number {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const db = getDb();
  const placeholders = userIds.map(() => '?').join(',');
  const stmt = db.prepare(`UPDATE users SET role = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`);
  const result = stmt.run(role, Date.now(), ...userIds);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'bulk_role_change', 'user', null, JSON.stringify({ userIds, role, changed: result.changes }));
  }
  return result.changes;
}

/** Bulk soft delete */
export function bulkSoftDelete(userIds: string[], actorId?: string): number {
  const db = getDb();
  const placeholders = userIds.map(() => '?').join(',');
  const now = Date.now();
  const stmt = db.prepare(`UPDATE users SET deleted_at = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`);
  const result = stmt.run(now, now, ...userIds);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'bulk_soft_delete', 'user', null, JSON.stringify({ userIds, deleted: result.changes }));
  }
  return result.changes;
}

/** Log an audit event */
export function logAudit(actorId: string, action: string, targetType: string, targetId: string | null, details?: string): void {
  const db = getDb();
  db.prepare('INSERT INTO audit_log (id, actor_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    crypto.randomUUID(), actorId, action, targetType, targetId, details || null, Date.now()
  );
}

/** Get audit trail entries for admin panel */
export function getAuditTrail(limit = 100, offset = 0): {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: number;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.id, a.actor_id, u.name as actor_name, a.action, a.target_type, a.target_id, a.details, a.created_at
    FROM audit_log a
    JOIN users u ON a.actor_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as {
    id: string;
    actor_id: string;
    actor_name: string;
    action: string;
    target_type: string;
    target_id: string | null;
    details: string | null;
    created_at: number;
  }[];
}

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
  return db.prepare(`
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
  `).all() as StudentProgress[];
}

export function getStudentProgressById(userId: string): {
  completion_rate: number;
  last_active: number | null;
  tasks_completed: number;
  avg_attempts: number;
} | null {
  const db = getDb();
  const totalTasks = TRAINING_TASKS.length;
  const row = db.prepare(`
    SELECT
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(userId) as { tasks_completed: number; avg_attempts: number; last_active: number | null } | undefined;

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
  const user = db.prepare(
    'SELECT streak_current FROM users WHERE id = ?'
  ).get(userId) as { streak_current: number | null } | undefined;
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

  const user = db.prepare(
    'SELECT name, streak_current, streak_longest FROM users WHERE id = ?'
  ).get(userId) as { name: string; streak_current: number; streak_longest: number } | undefined;

  if (!user) return recommendations;

  const progress = db.prepare(
    'SELECT task_id, attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC'
  ).all(userId) as { task_id: string; attempts: number }[];

  const completedSet = new Set(progress.map(p => p.task_id));
  const tasksCompleted = progress.length;
  const avgAttempts = progress.length > 0
    ? progress.reduce((s, p) => s + p.attempts, 0) / progress.length
    : 0;

  // Find tasks with high attempts (struggle areas)
  const struggleTasks = progress.filter(p => p.attempts > 3);

  // Find next uncompleted task (first in TRAINING_TASKS not yet done)
  const nextTask = TRAINING_TASKS.find(t => !completedSet.has(t.id));

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
      action_items: [
        isFirstTen
          ? t('student.recommendations.startHint')
          : t('student.recommendations.continueHint'),
      ],
    });
  }

  // 2. Review weak topics (tasks with high attempts)
  if (struggleTasks.length > 0) {
    const weakTaskIds = struggleTasks.map(t => t.task_id);
    const weakTasks = db.prepare(
      'SELECT task_id, MAX(attempts) as max_attempts FROM user_progress WHERE user_id = ? AND task_id IN (${placeholders}) GROUP BY task_id ORDER BY max_attempts DESC LIMIT 3'
        .replace('${placeholders}', weakTaskIds.map(() => '?').join(','))
    ).all(userId, ...weakTaskIds) as { task_id: string; max_attempts: number }[];

    recommendations.push({
      type: 'review_weak',
      priority: 'high',
      title: t('student.recommendations.reviewWeak'),
      description: t('student.recommendations.reviewWeakDesc'),
      action_items: weakTasks.slice(0, 3).map(wt =>
        `${TRAINING_TASKS.find(t => t.id === wt.task_id)?.title || wt.task_id} (${t('student.recommendations.attempts')}: ${wt.max_attempts})`
      ),
    });
  }

  // 3. Practice goal encouragement
  if (tasksCompleted < 10) {
    recommendations.push({
      type: 'practice_goal',
      priority: 'medium',
      title: t('student.recommendations.practiceGoal'),
      description: t('student.recommendations.practiceGoalDesc').replace('{count}', String(Math.max(0, 10 - tasksCompleted))),
      action_items: [
        t('student.recommendations.dailyPractice'),
        t('student.recommendations.useHints'),
      ],
    });
  } else if (tasksCompleted < TRAINING_TASKS.length * 0.5) {
    recommendations.push({
      type: 'practice_goal',
      priority: 'medium',
      title: t('student.recommendations.halfway'),
      description: t('student.recommendations.halfwayDesc')
        .replace('{completed}', String(tasksCompleted))
        .replace('{total}', String(TRAINING_TASKS.length)),
      action_items: [
        t('student.recommendations.focusIntermediate'),
        t('student.recommendations.trackProgress'),
      ],
    });
  }

  // 4. Streak encouragement
  if (user.streak_current >= 3) {
    recommendations.push({
      type: 'streak',
      priority: 'low',
      title: t('student.recommendations.streak'),
      description: t('student.recommendations.streakDesc')
        .replace('{streak}', String(user.streak_current)),
      action_items: [
        t('student.recommendations.keepStreak'),
      ],
    });
  } else if (tasksCompleted > 0 && (!user.streak_current || user.streak_current === 0)) {
    recommendations.push({
      type: 'streak',
      priority: 'low',
      title: t('student.recommendations.startStreak'),
      description: t('student.recommendations.startStreakDesc'),
      action_items: [
        t('student.recommendations.dailyTask'),
      ],
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
      action_items: [
        t('student.recommendations.tryAdvanced'),
        t('student.recommendations.helpOthers'),
      ],
    });
  }

  return recommendations;
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
  const studentsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };
  const teachersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as { count: number };
  const adminsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number };
  const totalCompletions = db.prepare('SELECT COUNT(*) as count FROM user_progress').get() as { count: number };
  const achievementsAwarded = db.prepare('SELECT COUNT(*) as count FROM user_achievements').get() as { count: number };

  let dbSizeBytes = 0;
  try {
    dbSizeBytes = fs.statSync(DB_PATH).size;
  } catch {
    // File doesn't exist yet
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

// ==================== Analytics ====================

export interface TaskAnalyticsEntry {
  task_id: string;
  title: string;
  difficulty: string;
  completions: number;
  avg_attempts: number;
  first_attempt_rate: number;
}

export function getTaskAnalytics(filters?: TimeRangeFilters): TaskAnalyticsEntry[] {
  const db = getDb();

  let query = `
    SELECT
      task_id,
      COUNT(*) as completions,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
    FROM user_progress
  `;
  const params: any[] = [];

  if (filters?.start_date || filters?.end_date) {
    query += ' WHERE 1=1';
    if (filters.start_date) {
      query += ' AND completed_at >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ' AND completed_at <= ?';
      params.push(filters.end_date);
    }
  }

  query += `
    GROUP BY task_id
    ORDER BY avg_attempts DESC
  `;

  return db.prepare(query).all(...params) as TaskAnalyticsEntry[];
}

export interface CompletionBucket {
  range: string;
  min: number;
  max: number;
  student_count: number;
}

export function getCompletionDistribution(filters?: TimeRangeFilters): CompletionBucket[] {
  const db = getDb();
  const buckets = [
    { range: '0-5', min: 0, max: 5 },
    { range: '6-10', min: 6, max: 10 },
    { range: '11-20', min: 11, max: 20 },
    { range: '21-35', min: 21, max: 35 },
    { range: '36-56', min: 36, max: 56 },
  ];

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND up.completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND up.completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const raw = db.prepare(`
    SELECT
      CASE
        WHEN tasks_completed BETWEEN 0 AND 5 THEN '0-5'
        WHEN tasks_completed BETWEEN 6 AND 10 THEN '6-10'
        WHEN tasks_completed BETWEEN 11 AND 20 THEN '11-20'
        WHEN tasks_completed BETWEEN 21 AND 35 THEN '21-35'
        WHEN tasks_completed BETWEEN 36 AND 56 THEN '36-56'
        ELSE '56+'
      END as range_label,
      COUNT(*) as student_count
    FROM (
      SELECT u.id, COUNT(up.task_id) as tasks_completed
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.role = 'student'${dateCondition}
      GROUP BY u.id
    )
    GROUP BY range_label
  `).all(...dateParams) as { range_label: string; student_count: number }[];

  const map = new Map(raw.map(r => [r.range_label, r.student_count]));
  return buckets.map(b => ({
    ...b,
    student_count: map.get(b.range) || 0,
  }));
}

export interface StudentDetail {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: number;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  beginner_completed: number;
  intermediate_completed: number;
  advanced_completed: number;
  achievements_count: number;
  last_active: number | null;
}

export function getStudentDetail(userId: string): StudentDetail | null {
  const db = getDb();
  const user = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.email, u.role, u.created_at,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(SUM(up.attempts), 0) as total_attempts,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'beginner-%' THEN 1 ELSE 0 END), 0) as beginner_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'intermediate-%' THEN 1 ELSE 0 END), 0) as intermediate_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'advanced-%' THEN 1 ELSE 0 END), 0) as advanced_completed,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(userId) as StudentDetail | undefined;

  if (!user) return null;

  const ach = db.prepare(
    'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?'
  ).get(userId) as { count: number };
  user.achievements_count = ach.count;

  return user;
}

export function getStudentCompletedTasks(userId: string): string[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT task_id FROM user_progress WHERE user_id = ?'
  ).all(userId) as { task_id: string }[];
  return rows.map(r => r.task_id);
}

export interface AchievementStatsEntry {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_count: number;
  total_students: number;
  earn_rate: number;
  recent_earners: { user_id: string; name: string; earned_at: number }[];
}

export function getAchievementStats(filters?: TimeRangeFilters): AchievementStatsEntry[] {
  const db = getDb();
  const totalStudents = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number };

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND ua.earned_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND ua.earned_at <= ?';
    dateParams.push(filters.end_date);
  }

  const achievements = db.prepare(`
    SELECT a.id, a.title, a.description, a.icon,
           COUNT(ua.user_id) as earned_count
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id${dateCondition ? ' WHERE 1=1' + dateCondition : ''}
    GROUP BY a.id, a.title, a.description, a.icon
    ORDER BY a.id
  `).all(...dateParams) as {
    id: string;
    title: string;
    description: string;
    icon: string;
    earned_count: number;
  }[];

  return achievements.map(a => {
    const earners = db.prepare(`
      SELECT ua.user_id, u.name, ua.earned_at
      FROM user_achievements ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.achievement_id = ?
      ORDER BY ua.earned_at DESC
      LIMIT 5
    `).all(a.id) as { user_id: string; name: string; earned_at: number }[];

    return {
      ...a,
      total_students: totalStudents.count,
      earn_rate: totalStudents.count > 0
        ? Math.round((a.earned_count / totalStudents.count) * 1000) / 10
        : 0,
      recent_earners: earners,
    };
  });
}

export interface DailyActivityEntry {
  date: string;
  completions: number;
  unique_users: number;
}

export function getDailyActivity(days = 30, filters?: TimeRangeFilters): DailyActivityEntry[] {
  const db = getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  let query = `
    SELECT
      date(completed_at / 1000, 'unixepoch') as day,
      COUNT(*) as completions,
      COUNT(DISTINCT user_id) as unique_users
    FROM user_progress
    WHERE completed_at >= ?
  `;
  const params: any[] = [cutoff];

  if (filters?.start_date && filters.start_date > cutoff) {
    params[0] = filters.start_date;
  }
  if (filters?.end_date) {
    query += ' AND completed_at <= ?';
    params.push(filters.end_date);
  }

  query += ' GROUP BY day ORDER BY day';

  const rows = db.prepare(query).all(...params) as { day: string; completions: number; unique_users: number }[];

  // Fill gaps with zero entries
  const result: DailyActivityEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const existing = rows.find(r => r.day === dateStr);
    result.push({
      date: dateStr,
      completions: existing?.completions || 0,
      unique_users: existing?.unique_users || 0,
    });
  }

  return result;
}

export interface AdminLeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  achievements_count: number;
  completion_rate: number;
}

export function getAdminLeaderboard(limit = 50, filters?: TimeRangeFilters): AdminLeaderboardEntry[] {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND up.completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND up.completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const rows = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.email,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(SUM(up.attempts), 0) as total_attempts,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'${dateCondition}
    GROUP BY u.id, u.name, u.email
    ORDER BY tasks_completed DESC, total_attempts ASC
    LIMIT ?
  `).all(...dateParams, limit) as {
    user_id: string;
    name: string;
    email: string;
    tasks_completed: number;
    total_attempts: number;
    avg_attempts: number;
    achievements_count: number;
  }[];

  const totalTasks = TRAINING_TASKS.length;
  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    completion_rate: Math.round((r.tasks_completed / totalTasks) * 1000) / 10,
  }));
}

export function getActiveUsersCount(days = 7, filters?: TimeRangeFilters): number {
  const db = getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  let query = `
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_progress
    WHERE completed_at >= ?
  `;
  const params: any[] = [cutoff];

  if (filters?.start_date && filters.start_date > cutoff) {
    params[0] = filters.start_date;
  }
  if (filters?.end_date) {
    query += ' AND completed_at <= ?';
    params.push(filters.end_date);
  }

  const row = db.prepare(query).get(...params) as { count: number };
  return row.count;
}

export function getAvgAttemptsPerTask(filters?: TimeRangeFilters): number {
  const db = getDb();

  let query = 'SELECT ROUND(AVG(attempts * 1.0), 2) as avg FROM user_progress';
  const params: any[] = [];

  if (filters?.start_date || filters?.end_date) {
    query += ' WHERE 1=1';
    if (filters.start_date) {
      query += ' AND completed_at >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ' AND completed_at <= ?';
      params.push(filters.end_date);
    }
  }

  const row = db.prepare(query).get(...params) as { avg: number };
  return row.avg || 0;
}

// ==================== Advanced Analytics ====================

export interface WeeklyProgressEntry {
  week: string;
  week_start: number;
  students_active: number;
  tasks_completed: number;
  avg_attempts: number;
  cumulative_students: number;
}

export function getWeeklyProgress(weeks = 12): WeeklyProgressEntry[] {
  const db = getDb();
  const cutoff = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;

  const rows = db.prepare(`
    SELECT
      date(completed_at / 1000, 'unixepoch', 'weekday 0') as week_start,
      COUNT(*) as tasks_completed,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      COUNT(DISTINCT user_id) as students_active
    FROM user_progress
    WHERE completed_at >= ?
    GROUP BY week_start
    ORDER BY week_start
  `).all(cutoff) as { week_start: string; tasks_completed: number; avg_attempts: number; students_active: number }[];

  // Calculate cumulative students
  let cumulative = 0;
  const studentSets = db.prepare(`
    SELECT
      date(completed_at / 1000, 'unixepoch', 'weekday 0') as week_start,
      COUNT(DISTINCT user_id) as new_students
    FROM user_progress
    WHERE completed_at >= ?
    GROUP BY week_start
    ORDER BY week_start
  `).all(cutoff) as { week_start: string; new_students: number }[];

  const result: WeeklyProgressEntry[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(cutoff + i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = d.toISOString().slice(0, 10);
    const existing = rows.find(r => r.week_start === weekStart);
    
    if (existing) {
      cumulative += existing.students_active;
    }

    result.push({
      week: `Week ${i + 1}`,
      week_start: new Date(weekStart).getTime(),
      students_active: existing?.students_active || 0,
      tasks_completed: existing?.tasks_completed || 0,
      avg_attempts: existing?.avg_attempts || 0,
      cumulative_students: cumulative,
    });
  }

  return result.filter(r => r.tasks_completed > 0 || r.students_active > 0);
}

export interface CohortEntry {
  cohort_month: string;
  month_0: number;
  month_1: number;
  month_2: number;
  month_3: number;
  total_students: number;
}

export function getCohortAnalysis(filters?: TimeRangeFilters): CohortEntry[] {
  const db = getDb();

  let userDateCondition = '';
  const userDateParams: any[] = [];
  if (filters?.start_date) {
    userDateCondition += ' AND u.created_at >= ?';
    userDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    userDateCondition += ' AND u.created_at <= ?';
    userDateParams.push(filters.end_date);
  }

  // Get students grouped by registration month
  const cohorts = db.prepare(`
    SELECT
      strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as cohort_month,
      COUNT(DISTINCT id) as total_students
    FROM users
    WHERE role = 'student'${userDateCondition}
    GROUP BY cohort_month
    ORDER BY cohort_month
  `).all(...userDateParams) as { cohort_month: string; total_students: number }[];

  // For each cohort, calculate retention by month
  return cohorts.map(cohort => {
    const monthOffsets = [0, 1, 2, 3];
    const retention = monthOffsets.map(offset => {
      let progressDateCondition = '';
      const progressDateParams: any[] = [cohort.cohort_month, `+${offset} months`];
      if (filters?.start_date) {
        progressDateCondition += ' AND up.completed_at >= ?';
        progressDateParams.push(filters.start_date);
      }
      if (filters?.end_date) {
        progressDateCondition += ' AND up.completed_at <= ?';
        progressDateParams.push(filters.end_date);
      }

      const row = db.prepare(`
        SELECT COUNT(DISTINCT up.user_id) as active_students
        FROM users u
        JOIN user_progress up ON u.id = up.user_id
        WHERE u.role = 'student'
          AND strftime('%Y-%m', datetime(u.created_at / 1000, 'unixepoch')) = ?
          AND strftime('%Y-%m', datetime(up.completed_at / 1000, 'unixepoch')) = 
              strftime('%Y-%m', datetime(u.created_at / 1000, 'unixepoch', ?))${progressDateCondition}
      `).get(...progressDateParams) as { active_students: number };

      return row.active_students;
    });

    return {
      cohort_month: cohort.cohort_month,
      month_0: retention[0],
      month_1: retention[1],
      month_2: retention[2],
      month_3: retention[3],
      total_students: cohort.total_students,
    };
  });
}

export interface StudentPerformanceCard {
  user_id: string;
  name: string;
  email: string;
  created_at: number;
  last_active: number | null;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  beginner_completed: number;
  intermediate_completed: number;
  advanced_completed: number;
  achievements_count: number;
  completion_rate: number;
  performance_trend: 'improving' | 'stable' | 'declining';
  streak: number;
  weakest_difficulty: string;
}

export function getStudentPerformanceCards(limit = 20, filters?: TimeRangeFilters): StudentPerformanceCard[] {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND up.completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND up.completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.email, u.created_at,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(SUM(up.attempts), 0) as total_attempts,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'beginner-%' THEN 1 ELSE 0 END), 0) as beginner_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'intermediate-%' THEN 1 ELSE 0 END), 0) as intermediate_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'advanced-%' THEN 1 ELSE 0 END), 0) as advanced_completed,
      (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'${dateCondition}
    GROUP BY u.id, u.name, u.email, u.created_at
    ORDER BY tasks_completed DESC
    LIMIT ?
  `).all(...dateParams, limit) as {
    user_id: string;
    name: string;
    email: string;
    created_at: number;
    tasks_completed: number;
    total_attempts: number;
    avg_attempts: number;
    beginner_completed: number;
    intermediate_completed: number;
    advanced_completed: number;
    achievements_count: number;
    last_active: number | null;
  }[];

  const now = Date.now();
  const recentCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const previousCutoff = now - 60 * 24 * 60 * 60 * 1000;

  // Batch: get recent completions for all students in one query
  const studentIds = students.map(s => s.user_id);
  const idPlaceholders = studentIds.map(() => '?').join(',');

  const recentData = db.prepare(`
    SELECT user_id, COUNT(*) as recent_count
    FROM user_progress
    WHERE user_id IN (${idPlaceholders}) AND completed_at >= ?
    GROUP BY user_id
  `).all(...studentIds, recentCutoff) as { user_id: string; recent_count: number }[];

  const previousData = db.prepare(`
    SELECT user_id, COUNT(*) as prev_count
    FROM user_progress
    WHERE user_id IN (${idPlaceholders}) AND completed_at >= ? AND completed_at < ?
    GROUP BY user_id
  `).all(...studentIds, previousCutoff, recentCutoff) as { user_id: string; prev_count: number }[];

  // Batch: get streaks for all students in one query
  const streakData = db.prepare(`
    SELECT user_id, attempts, completed_at
    FROM user_progress
    WHERE user_id IN (${idPlaceholders})
    ORDER BY user_id, completed_at ASC
  `).all(...studentIds) as { user_id: string; attempts: number; completed_at: number }[];

  const streakMap = new Map<string, number>();
  const userStreaks = new Map<string, number>();
  for (const row of streakData) {
    const currentStreak = userStreaks.get(row.user_id) ?? 0;
    if (row.attempts === 1) {
      userStreaks.set(row.user_id, currentStreak + 1);
    } else {
      userStreaks.set(row.user_id, 0);
    }
    streakMap.set(row.user_id, Math.max(streakMap.get(row.user_id) ?? 0, userStreaks.get(row.user_id) ?? 0));
  }

  const recentMap = new Map(recentData.map(d => [d.user_id, d.recent_count]));
  const previousMap = new Map(previousData.map(d => [d.user_id, d.prev_count]));

  const totalTasks = TRAINING_TASKS.length;

  return students.map(student => {
    const recentCount = recentMap.get(student.user_id) || 0;
    const previousCount = previousMap.get(student.user_id) || 0;

    let performance_trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (previousCount === 0) {
      performance_trend = recentCount > 0 ? 'improving' : 'stable';
    } else if (recentCount > previousCount * 1.2) performance_trend = 'improving';
    else if (recentCount < previousCount * 0.8) performance_trend = 'declining';

    // Determine weakest difficulty
    const totalBeginner = TRAINING_TASKS.filter(t => t.difficulty === 'beginner').length || 8;
    const totalIntermediate = TRAINING_TASKS.filter(t => t.difficulty === 'intermediate').length || 15;
    const totalAdvanced = TRAINING_TASKS.filter(t => t.difficulty === 'advanced').length || 25;
    let weakest_difficulty = 'beginner';
    const rates = [
      student.beginner_completed / totalBeginner,
      student.intermediate_completed / totalIntermediate,
      student.advanced_completed / totalAdvanced,
    ];
    const minRate = Math.min(...rates);
    if (minRate === rates[2]) weakest_difficulty = 'advanced';
    else if (minRate === rates[1]) weakest_difficulty = 'intermediate';

    return {
      ...student,
      completion_rate: Math.round((student.tasks_completed / totalTasks) * 1000) / 10,
      performance_trend,
      streak: streakMap.get(student.user_id) || 0,
      weakest_difficulty,
    };
  });
}

export interface DifficultyComparisonEntry {
  difficulty: string;
  total_students_attempted: number;
  total_completions: number;
  avg_attempts: number;
  completion_rate: number;
  first_attempt_rate: number;
  avg_time_to_complete: number;
}

export function getDifficultyComparison(filters?: TimeRangeFilters): DifficultyComparisonEntry[] {
  const db = getDb();
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const totalTasksByDifficulty: Record<string, number> = {
    beginner: 8,
    intermediate: 15,
    advanced: 25,
  };

  return difficulties.map(difficulty => {
    let dateCondition = '';
    const dateParams: any[] = [`${difficulty}-%`];
    if (filters?.start_date) {
      dateCondition += ' AND completed_at >= ?';
      dateParams.push(filters.start_date);
    }
    if (filters?.end_date) {
      dateCondition += ' AND completed_at <= ?';
      dateParams.push(filters.end_date);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as total_students_attempted,
        COUNT(*) as total_completions,
        ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
        ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
      FROM user_progress
      WHERE task_id LIKE ?${dateCondition}
    `).get(...dateParams) as {
      total_students_attempted: number;
      total_completions: number;
      avg_attempts: number;
      first_attempt_rate: number;
    };

    const totalStudents = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    ).get() as { count: number };

    const timeEstimates = getTimeToCompleteEstimates();
    const difficultyTime = timeEstimates
      .filter(t => t.difficulty === difficulty)
      .reduce((sum, t) => sum + t.estimated_time_minutes, 0);
    const difficultyTaskCount = timeEstimates.filter(t => t.difficulty === difficulty).length;
    const avg_time = difficultyTaskCount > 0
      ? Math.round(difficultyTime / difficultyTaskCount)
      : 0;

    return {
      difficulty,
      total_students_attempted: stats.total_students_attempted,
      total_completions: stats.total_completions,
      avg_attempts: stats.avg_attempts,
      completion_rate: totalStudents.count > 0
        ? Math.round((stats.total_students_attempted / totalStudents.count) * 1000) / 10
        : 0,
      first_attempt_rate: stats.first_attempt_rate,
      avg_time_to_complete: avg_time,
    };
  });
}

export interface TimeRangeFilters {
  start_date?: number;
  end_date?: number;
}

export function getDailyActivityWithFilters(days = 30, filters?: TimeRangeFilters): DailyActivityEntry[] {
  const db = getDb();
  
  let cutoff: number;
  if (filters?.start_date) {
    cutoff = filters.start_date;
  } else {
    cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  }

  let query = `
    SELECT
      date(completed_at / 1000, 'unixepoch') as day,
      COUNT(*) as completions,
      COUNT(DISTINCT user_id) as unique_users
    FROM user_progress
    WHERE completed_at >= ?
  `;
  const params: any[] = [cutoff];

  if (filters?.end_date) {
    query += ' AND completed_at <= ?';
    params.push(filters.end_date);
  }

  query += ' GROUP BY day ORDER BY day';

  const rows = db.prepare(query).all(...params) as { day: string; completions: number; unique_users: number }[];

  // Fill gaps
  const endDate = filters?.end_date ? new Date(filters.end_date) : new Date();
  const startDate = filters?.start_date ? new Date(filters.start_date) : new Date(cutoff);
  
  const result: DailyActivityEntry[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const existing = rows.find(r => r.day === dateStr);
    result.push({
      date: dateStr,
      completions: existing?.completions || 0,
      unique_users: existing?.unique_users || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// ==================== Automated Alerts & Recommendations ====================

export interface StudentAlert {
  user_id: string;
  name: string;
  email: string;
  alert_type: 'at_risk' | 'inactive' | 'struggling' | 'excelling' | 'milestone';
  severity: 'high' | 'medium' | 'low';
  message: string;
  created_at: number;
  metadata: Record<string, unknown>;
}

export function generateStudentAlerts(filters?: TimeRangeFilters): StudentAlert[] {
  const db = getDb();
  const alerts: StudentAlert[] = [];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const totalTasks = TRAINING_TASKS.length;

  // Single query: fetch all student data with progress and last activity
  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND up.completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND up.completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.created_at,
      MAX(up.completed_at) as last_active,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id${dateCondition}
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email, u.created_at
  `).all(...dateParams) as {
    id: string; name: string; email: string; created_at: number;
    last_active: number | null; tasks_completed: number; avg_attempts: number;
  }[];

  for (const student of students) {
    // Check if student is inactive (no activity in 7 days)
    if (student.last_active && student.last_active < sevenDaysAgo) {
      const daysInactive = Math.floor((now - student.last_active) / (24 * 60 * 60 * 1000));
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'inactive',
        severity: daysInactive > 14 ? 'high' : 'medium',
        message: `Неактивен ${daysInactive} дней`,
        created_at: now,
        metadata: { daysInactive, lastActive: student.last_active },
      });
    }

    // Check if student is struggling (high avg attempts)
    if (student.tasks_completed >= 3 && student.avg_attempts > 3) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'struggling',
        severity: student.avg_attempts > 5 ? 'high' : 'medium',
        message: `Высокое число попыток (ср. ${student.avg_attempts})`,
        created_at: now,
        metadata: { tasksCompleted: student.tasks_completed, avgAttempts: student.avg_attempts },
      });
    }

    // Check if student is at risk (low completion rate after 30 days)
    const daysSinceRegistration = Math.floor((now - student.created_at) / (24 * 60 * 60 * 1000));
    if (daysSinceRegistration >= 30 && student.tasks_completed < 5) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'at_risk',
        severity: 'high',
        message: `Критически низкий прогресс (${student.tasks_completed}/${totalTasks} заданий)`,
        created_at: now,
        metadata: { daysSinceRegistration, tasksCompleted: student.tasks_completed },
      });
    }

    // Check if student is excelling (completed > 80% with low attempts)
    const completionRate = student.tasks_completed / totalTasks;
    if (completionRate > 0.8 && student.avg_attempts < 2) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'excelling',
        severity: 'low',
        message: `Отличная успеваемость (${student.tasks_completed}/${totalTasks}, ср. ${student.avg_attempts} попыток)`,
        created_at: now,
        metadata: { tasksCompleted: student.tasks_completed, avgAttempts: student.avg_attempts },
      });
    }

    // Check milestones
    if (student.tasks_completed === 10 || student.tasks_completed === 25 || student.tasks_completed === 50) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'milestone',
        severity: 'low',
        message: `Достигнута веха: ${student.tasks_completed} заданий выполнено`,
        created_at: now,
        metadata: { tasksCompleted: student.tasks_completed },
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export interface Recommendation {
  user_id: string;
  name: string;
  recommendation_type: 'practice_more' | 'review_basics' | 'advance_level' | 'seek_help' | 'maintain_pace';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action_items: string[];
}

export function generateRecommendations(filters?: TimeRangeFilters): Recommendation[] {
  const db = getDb();
  const recommendations: Recommendation[] = [];

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND up.completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND up.completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT
      u.id, u.name, u.email,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'beginner-%' THEN 1 ELSE 0 END), 0) as beginner_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'intermediate-%' THEN 1 ELSE 0 END), 0) as intermediate_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'advanced-%' THEN 1 ELSE 0 END), 0) as advanced_completed
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id${dateCondition}
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email
  `).all(...dateParams) as {
    id: string; name: string; email: string;
    tasks_completed: number; avg_attempts: number;
    beginner_completed: number; intermediate_completed: number; advanced_completed: number;
  }[];

  for (const student of students) {
    const progress = {
      tasks_completed: student.tasks_completed,
      avg_attempts: student.avg_attempts,
      beginner_completed: student.beginner_completed,
      intermediate_completed: student.intermediate_completed,
      advanced_completed: student.advanced_completed,
    };

    // Recommendation: Practice more (low activity)
    if (progress.tasks_completed < 10) {
      recommendations.push({
        user_id: student.id,
        name: student.name,
        recommendation_type: 'practice_more',
        priority: 'high',
        description: 'Необходимо увеличить практику',
        action_items: [
          'Выполнять минимум 2-3 задания в неделю',
          'Начать с заданий уровня "Начальный"',
          'Использовать подсказки при затруднении',
        ],
      });
    }

    // Recommendation: Review basics (struggling with beginner tasks)
    if (progress.beginner_completed < 5 && progress.avg_attempts > 3) {
      recommendations.push({
        user_id: student.id,
        name: student.name,
        recommendation_type: 'review_basics',
        priority: 'high',
        description: 'Рекомендуется повторить основы SQL',
        action_items: [
          'Повторить SELECT, WHERE, ORDER BY',
          'Изучить JOIN на простых примерах',
          'Практиковать базовые запросы',
        ],
      });
    }

    // Recommendation: Advance level (doing well)
    if (progress.intermediate_completed >= 10 && progress.avg_attempts < 2.5) {
      recommendations.push({
        user_id: student.id,
        name: student.name,
        recommendation_type: 'advance_level',
        priority: 'medium',
        description: 'Готов к продвинутому уровню',
        action_items: [
          'Перейти к заданиям "Продвинутый"',
          'Изучить подзапросы и оконные функции',
          'Попробовать режим практики',
        ],
      });
    }

    // Recommendation: Seek help (very high attempts)
    if (progress.tasks_completed >= 5 && progress.avg_attempts > 5) {
      recommendations.push({
        user_id: student.id,
        name: student.name,
        recommendation_type: 'seek_help',
        priority: 'high',
        description: 'Рекомендуется обратиться за помощью',
        action_items: [
          'Обратиться к преподавателю',
          'Изучить справочник SQL',
          'Разобрать примеры решений',
        ],
      });
    }

    // Recommendation: Maintain pace (good progress)
    if (progress.tasks_completed >= 20 && progress.avg_attempts >= 1.5 && progress.avg_attempts <= 3) {
      recommendations.push({
        user_id: student.id,
        name: student.name,
        recommendation_type: 'maintain_pace',
        priority: 'low',
        description: 'Хороший прогресс, продолжайте в том же духе',
        action_items: [
          'Поддерживать текущий темп',
          'Помогать другим студентам',
          'Изучать дополнительные материалы',
        ],
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export interface ClassReport {
  total_students: number;
  active_students: number;
  avg_completion_rate: number;
  avg_attempts: number;
  at_risk_count: number;
  excelling_count: number;
  top_performers: { name: string; tasks_completed: number; avg_attempts: number }[];
  struggling_students: { name: string; tasks_completed: number; avg_attempts: number }[];
  inactive_students: { name: string; last_active: number }[];
}

export function generateClassReport(filters?: TimeRangeFilters): ClassReport {
  const db = getDb();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalStudents = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number };

  let activeDateCondition = '';
  const activeDateParams: any[] = [sevenDaysAgo];
  if (filters?.start_date && filters.start_date > sevenDaysAgo) {
    activeDateParams[0] = filters.start_date;
  }
  if (filters?.end_date) {
    activeDateCondition += ' AND completed_at <= ?';
    activeDateParams.push(filters.end_date);
  }
  const activeStudents = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_progress
    WHERE completed_at >= ?${activeDateCondition}
  `).get(...activeDateParams) as { count: number };

  let studentDateCondition = '';
  const studentDateParams: any[] = [];
  if (filters?.start_date) {
    studentDateCondition += ' AND up.completed_at >= ?';
    studentDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    studentDateCondition += ' AND up.completed_at <= ?';
    studentDateParams.push(filters.end_date);
  }

  const allStudents = db.prepare(`
    SELECT 
      u.name,
      COUNT(up.task_id) as tasks_completed,
      ROUND(AVG(up.attempts * 1.0), 2) as avg_attempts,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'${studentDateCondition}
    GROUP BY u.id, u.name
  `).all(...studentDateParams) as {
    name: string;
    tasks_completed: number;
    avg_attempts: number;
    last_active: number | null;
  }[];

  const totalTasks = TRAINING_TASKS.length;
  const avgCompletionRate = allStudents.length > 0
    ? Math.round((allStudents.reduce((sum, s) => sum + (s.tasks_completed / totalTasks) * 100, 0) / allStudents.length) * 10) / 10
    : 0;

  const avgAttempts = allStudents.length > 0
    ? Math.round((allStudents.reduce((sum, s) => sum + s.avg_attempts, 0) / allStudents.length) * 100) / 100
    : 0;

  const atRiskCount = allStudents.filter(s => s.tasks_completed < 5).length;
  const excellingCount = allStudents.filter(s => s.tasks_completed > 45 && s.avg_attempts < 2).length;

  const topPerformers = allStudents
    .filter(s => s.tasks_completed > 30 && s.avg_attempts < 2.5)
    .sort((a, b) => b.tasks_completed - a.tasks_completed)
    .slice(0, 5)
    .map(s => ({ name: s.name, tasks_completed: s.tasks_completed, avg_attempts: s.avg_attempts }));

  const strugglingStudents = allStudents
    .filter(s => s.avg_attempts > 4 && s.tasks_completed >= 3)
    .sort((a, b) => b.avg_attempts - a.avg_attempts)
    .slice(0, 5)
    .map(s => ({ name: s.name, tasks_completed: s.tasks_completed, avg_attempts: s.avg_attempts }));

  const inactiveStudents = allStudents
    .filter(s => !s.last_active || s.last_active < sevenDaysAgo)
    .sort((a, b) => (a.last_active || 0) - (b.last_active || 0))
    .slice(0, 10)
    .map(s => ({ name: s.name, last_active: s.last_active || 0 }));

  return {
    total_students: totalStudents.count,
    active_students: activeStudents.count,
    avg_completion_rate: avgCompletionRate,
    avg_attempts: avgAttempts,
    at_risk_count: atRiskCount,
    excelling_count: excellingCount,
    top_performers: topPerformers,
    struggling_students: strugglingStudents,
    inactive_students: inactiveStudents,
  };
}

export interface ErrorPatternEntry {
  task_id: string;
  task_name: string;
  difficulty: string;
  high_attempt_count: number;
  avg_attempts: number;
  max_attempts: number;
  failure_rate: number;
}

export interface TimeToCompleteEntry {
  task_id: string;
  task_name: string;
  difficulty: string;
  avg_position: number;
  estimated_time_minutes: number;
  completion_order: number;
}

export interface HeatmapEntry {
  date: string;
  completions: number;
  day_of_week: number;
  week_number: number;
}

export interface EngagementMetric {
  user_id: string;
  name: string;
  email: string;
  engagement_score: number;
  consistency_score: number;
  velocity: number;
  last_active_days: number;
  engagement_level: 'high' | 'medium' | 'low' | 'at_risk';
}

export function getErrorPatternAnalysis(filters?: TimeRangeFilters): ErrorPatternEntry[] {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const taskAttempts = db.prepare(`
    SELECT 
      up.task_id,
      COUNT(*) as students_attempted,
      ROUND(AVG(up.attempts * 1.0), 2) as avg_attempts,
      MAX(up.attempts) as max_attempts,
      SUM(CASE WHEN up.attempts > 3 THEN 1 ELSE 0 END) as high_attempt_count
    FROM user_progress up
    WHERE 1=1${dateCondition}
    GROUP BY up.task_id
    ORDER BY avg_attempts DESC
  `).all(...dateParams) as Array<{
    task_id: string;
    students_attempted: number;
    avg_attempts: number;
    max_attempts: number;
    high_attempt_count: number;
  }>;

  return taskAttempts.map(task => {
    const difficulty = task.task_id.startsWith('beginner-') ? 'beginner'
      : task.task_id.startsWith('intermediate-') ? 'intermediate' : 'advanced';
    
    const taskName = task.task_id
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      task_id: task.task_id,
      task_name: taskName,
      difficulty,
      high_attempt_count: task.high_attempt_count,
      avg_attempts: task.avg_attempts,
      max_attempts: task.max_attempts,
      failure_rate: Math.round((task.high_attempt_count / task.students_attempted) * 100),
    };
  });
}

export function getTimeToCompleteEstimates(filters?: TimeRangeFilters): TimeToCompleteEntry[] {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const taskOrderData = db.prepare(`
    SELECT 
      up.task_id,
      AVG(subquery.position) as avg_position
    FROM user_progress up
    JOIN (
      SELECT 
        user_id,
        task_id,
        (SELECT COUNT(*) FROM user_progress up2 
         WHERE up2.user_id = up.user_id AND up2.completed_at <= up.completed_at${dateCondition}) as position
      FROM user_progress
      WHERE 1=1${dateCondition}
    ) subquery ON up.user_id = subquery.user_id AND up.task_id = subquery.task_id
    GROUP BY up.task_id
    ORDER BY avg_position ASC
  `).all(...dateParams, ...dateParams) as Array<{ task_id: string; avg_position: number }>;

  // Estimate time based on position (assume ~3 min per task on average)
  return taskOrderData.map((task, index) => {
    const difficulty = task.task_id.startsWith('beginner-') ? 'beginner'
      : task.task_id.startsWith('intermediate-') ? 'intermediate' : 'advanced';
    
    const taskName = task.task_id
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    // Estimate: beginner=2min, intermediate=4min, advanced=6min base
    const baseTime = difficulty === 'beginner' ? 2 : difficulty === 'intermediate' ? 4 : 6;
    const estimatedTime = Math.round(baseTime * (task.avg_position / 10));

    return {
      task_id: task.task_id,
      task_name: taskName,
      difficulty,
      avg_position: Math.round(task.avg_position * 10) / 10,
      estimated_time_minutes: estimatedTime,
      completion_order: index + 1,
    };
  });
}

export function getActivityHeatmap(days: number = 90): HeatmapEntry[] {
  const db = getDb();
  const now = Date.now();
  const cutoffTime = now - days * 24 * 60 * 60 * 1000;

  const rows = db.prepare(`
    SELECT 
      DATE((completed_at / 1000), 'unixepoch') as date,
      COUNT(*) as completions,
      CAST(STRFTIME('%w', DATE((completed_at / 1000), 'unixepoch')) AS INTEGER) as day_of_week,
      CAST(STRFTIME('%W', DATE((completed_at / 1000), 'unixepoch')) AS INTEGER) as week_number
    FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?
    GROUP BY DATE((completed_at / 1000), 'unixepoch')
    ORDER BY date ASC
  `).all(cutoffTime) as HeatmapEntry[];

  // Fill in missing dates with 0 completions
  const entryMap = new Map<string, HeatmapEntry>();
  for (const row of rows) {
    entryMap.set(row.date, row);
  }

  const result: HeatmapEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const weekNum = Math.floor((days - 1 - i) / 7);

    const entry = entryMap.get(dateStr);
    if (entry) {
      result.push(entry);
    } else {
      result.push({ date: dateStr, completions: 0, day_of_week: dayOfWeek, week_number: weekNum });
    }
  }

  return result;
}

export function getStudentEngagementMetrics(limit: number = 50, filters?: TimeRangeFilters): EngagementMetric[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.tasks_completed, u.last_active, u.created_at,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id${dateCondition}) as total_progress,
      (SELECT AVG(attempts) FROM user_progress WHERE user_id = u.id${dateCondition}) as avg_attempts
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.tasks_completed DESC
    LIMIT ?
  `).all(...dateParams, ...dateParams, limit) as Array<{
    id: string;
    name: string;
    email: string;
    tasks_completed: number;
    last_active: number | null;
    created_at: number;
    total_progress: number;
    avg_attempts: number | null;
  }>;

  return students.map(student => {
    const daysSinceCreated = (now - student.created_at) / dayMs;
    const daysSinceActive = student.last_active
      ? (now - student.last_active) / dayMs
      : 999;

    // Engagement score (0-100): based on completion rate, activity recency, and consistency
    const completionRate = Math.min((student.tasks_completed / TRAINING_TASKS.length) * 100, 100);
    const recencyScore = Math.max(0, 100 - (daysSinceActive * 5));
    const consistencyScore = daysSinceCreated > 0
      ? Math.min((student.total_progress / daysSinceCreated) * 10, 100)
      : 0;

    const engagementScore = Math.round(
      (completionRate * 0.4) + (recencyScore * 0.3) + (consistencyScore * 0.3)
    );

    // Velocity: tasks per week
    const weeksSinceCreated = daysSinceCreated / 7;
    const velocity = weeksSinceCreated > 0
      ? Math.round((student.tasks_completed / weeksSinceCreated) * 10) / 10
      : student.tasks_completed;

    let engagementLevel: EngagementMetric['engagement_level'];
    if (engagementScore >= 70) engagementLevel = 'high';
    else if (engagementScore >= 40) engagementLevel = 'medium';
    else if (engagementScore >= 20) engagementLevel = 'low';
    else engagementLevel = 'at_risk';

    return {
      user_id: student.id,
      name: student.name,
      email: student.email,
      engagement_score: engagementScore,
      consistency_score: Math.round(consistencyScore * 10) / 10,
      velocity,
      last_active_days: Math.round(daysSinceActive),
      engagement_level: engagementLevel,
    };
  });
}

export interface ChurnPrediction {
  user_id: string;
  name: string;
  email: string;
  churn_score: number; // 0-100, higher = more likely to churn
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  last_active_days: number;
  completion_rate: number;
  velocity_trend: 'improving' | 'stable' | 'declining';
  predicted_action: string;
}

export interface WeekOverWeekEntry {
  metric: string;
  current: number;
  previous: number;
  change_percent: number;
}

export function getChurnPredictions(limit: number = 50, filters?: TimeRangeFilters): ChurnPrediction[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let baseDateCondition = '';
  const baseDateParams: any[] = [];
  if (filters?.start_date) {
    baseDateCondition += ' AND completed_at >= ?';
    baseDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    baseDateCondition += ' AND completed_at <= ?';
    baseDateParams.push(filters.end_date);
  }

  // Build conditions for recent/previous completions with filters applied
  const recentCondition = `completed_at > ?${baseDateCondition}`;
  const prevCondition = `completed_at > ? AND completed_at <= ?${baseDateCondition}`;
  const totalCountCondition = baseDateCondition;

  const students = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.tasks_completed, u.last_active, u.created_at,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id${totalCountCondition}) as total_progress,
      (SELECT AVG(attempts) FROM user_progress WHERE user_id = u.id${totalCountCondition}) as avg_attempts,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND ${recentCondition}) as recent_completions,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND ${prevCondition}) as previous_completions
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.tasks_completed ASC
    LIMIT ?
  `).all(...baseDateParams, ...baseDateParams, now - 14 * dayMs, ...baseDateParams, now - 28 * dayMs, now - 14 * dayMs, ...baseDateParams, limit) as Array<{
    id: string;
    name: string;
    email: string;
    tasks_completed: number;
    last_active: number | null;
    created_at: number;
    total_progress: number;
    avg_attempts: number | null;
    recent_completions: number;
    previous_completions: number;
  }>;

  return students.map(student => {
    const daysSinceCreated = (now - student.created_at) / dayMs;
    const daysSinceActive = student.last_active
      ? (now - student.last_active) / dayMs
      : 999;

    const completionRate = Math.min((student.tasks_completed / TRAINING_TASKS.length) * 100, 100);
    const riskFactors: string[] = [];

    // Factor 1: Inactivity (0-35 points)
    let inactivityScore = 0;
    if (daysSinceActive > 30) {
      inactivityScore = 35;
      riskFactors.push('Неактивен более 30 дней');
    } else if (daysSinceActive > 14) {
      inactivityScore = 25;
      riskFactors.push('Неактивен более 14 дней');
    } else if (daysSinceActive > 7) {
      inactivityScore = 10;
      riskFactors.push('Неактивен более 7 дней');
    }

    // Factor 2: Low completion rate (0-25 points)
    let completionScore = 0;
    if (completionRate < 10) {
      completionScore = 25;
      riskFactors.push('Крайне низкий прогресс');
    } else if (completionRate < 25) {
      completionScore = 18;
      riskFactors.push('Низкий прогресс');
    } else if (completionRate < 50) {
      completionScore = 8;
    }

    // Factor 3: Velocity trend (0-20 points)
    let velocityScore = 0;
    const velocityTrend: ChurnPrediction['velocity_trend'] = 
      student.previous_completions === 0
        ? (student.recent_completions > 0 ? 'improving' : 'stable')
        : student.recent_completions === 0
        ? 'declining'
        : student.recent_completions < student.previous_completions * 0.5
        ? 'declining'
        : student.recent_completions > student.previous_completions * 1.2
        ? 'improving'
        : 'stable';

    if (velocityTrend === 'declining') {
      velocityScore = 20;
      riskFactors.push('Снижение активности');
    } else if (student.recent_completions === 0 && student.previous_completions === 0 && daysSinceCreated > 14) {
      velocityScore = 15;
      riskFactors.push('Нет прогресса');
    }

    // Factor 4: High attempts (frustration indicator) (0-10 points)
    let frustrationScore = 0;
    if (student.avg_attempts && student.avg_attempts > 5 && student.tasks_completed > 3) {
      frustrationScore = 10;
      riskFactors.push('Высокое число попыток (фрустрация)');
    } else if (student.avg_attempts && student.avg_attempts > 3.5) {
      frustrationScore = 5;
    }

    // Factor 5: New student risk (0-10 points)
    let newStudentScore = 0;
    if (daysSinceCreated < 7 && student.tasks_completed < 2) {
      newStudentScore = 10;
      riskFactors.push('Новый студент без прогресса');
    } else if (daysSinceCreated < 14 && student.tasks_completed < 5) {
      newStudentScore = 5;
    }

    const churnScore = Math.min(inactivityScore + completionScore + velocityScore + frustrationScore + newStudentScore, 100);

    // Determine risk level
    let riskLevel: ChurnPrediction['risk_level'];
    if (churnScore >= 75) riskLevel = 'critical';
    else if (churnScore >= 50) riskLevel = 'high';
    else if (churnScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    // Generate predicted action
    let predictedAction = '';
    if (riskLevel === 'critical') {
      predictedAction = 'Срочное вмешательство: персональное обращение';
    } else if (riskLevel === 'high') {
      predictedAction = 'Рекомендовать повторение основ, предложить помощь';
    } else if (riskLevel === 'medium') {
      predictedAction = 'Мониторинг, мотивационные уведомления';
    } else {
      predictedAction = 'Продолжать наблюдение';
    }

    return {
      user_id: student.id,
      name: student.name,
      email: student.email,
      churn_score: churnScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      last_active_days: Math.round(daysSinceActive),
      completion_rate: Math.round(completionRate),
      velocity_trend: velocityTrend,
      predicted_action: predictedAction,
    };
  });
}

export function getWeekOverWeekComparison(filters?: TimeRangeFilters): WeekOverWeekEntry[] {
  const db = getDb();
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const currentWeekStart = now - weekMs;
  const previousWeekStart = now - 2 * weekMs;

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  // Completions: current vs previous week
  const currentCompletions = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?${dateCondition}
  `).get(currentWeekStart, ...dateParams) as { count: number };

  const previousCompletions = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?${dateCondition}
  `).get(previousWeekStart, currentWeekStart, ...dateParams) as { count: number };

  // Active users: current vs previous week
  const currentActive = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?${dateCondition}
  `).get(currentWeekStart, ...dateParams) as { count: number };

  const previousActive = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?${dateCondition}
  `).get(previousWeekStart, currentWeekStart, ...dateParams) as { count: number };

  // Avg attempts: current vs previous week
  const currentAttempts = db.prepare(`
    SELECT COALESCE(ROUND(AVG(attempts * 1.0), 2), 0) as avg_val FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?${dateCondition}
  `).get(currentWeekStart, ...dateParams) as { avg_val: number };

  const previousAttempts = db.prepare(`
    SELECT COALESCE(ROUND(AVG(attempts * 1.0), 2), 0) as avg_val FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?${dateCondition}
  `).get(previousWeekStart, currentWeekStart, ...dateParams) as { avg_val: number };

  const calcChange = (current: number, previous: number) =>
    previous === 0 ? (current === 0 ? 0 : 100) : Math.round(((current - previous) / previous) * 100);

  return [
    {
      metric: 'completions',
      current: currentCompletions.count,
      previous: previousCompletions.count,
      change_percent: calcChange(currentCompletions.count, previousCompletions.count),
    },
    {
      metric: 'active_users',
      current: currentActive.count,
      previous: previousActive.count,
      change_percent: calcChange(currentActive.count, previousActive.count),
    },
    {
      metric: 'avg_attempts',
      current: currentAttempts.avg_val,
      previous: previousAttempts.avg_val,
      change_percent: calcChange(currentAttempts.avg_val, previousAttempts.avg_val),
    },
  ];
}

// ==================== Student Skill Breakdown (Radar) ====================

export interface SkillCategory {
  name: string;
  taskIds: string[];
  totalTasks: number;
}

let _skillCategories: SkillCategory[] | null = null;

function buildTaskSkillCategories(): SkillCategory[] {
  if (_skillCategories) return _skillCategories;

  const categories: SkillCategory[] = [
    { name: 'select', taskIds: [], totalTasks: 0 },
    { name: 'joins', taskIds: [], totalTasks: 0 },
    { name: 'aggregation', taskIds: [], totalTasks: 0 },
    { name: 'subqueries', taskIds: [], totalTasks: 0 },
    { name: 'dml', taskIds: [], totalTasks: 0 },
    { name: 'advanced', taskIds: [], totalTasks: 0 },
  ];

  for (const task of TRAINING_TASKS) {
    const cat = categorizeTask(task.taskText);
    const category = categories.find(c => c.name === cat);
    if (category) {
      category.taskIds.push(task.id);
      category.totalTasks++;
    }
  }

  _skillCategories = categories;
  return categories;
}

function categorizeTask(taskText: string): string {
  const lower = taskText.toLowerCase();
  if (lower.includes('insert ') || lower.includes('update ') || lower.includes('delete ') || lower.includes('on conflict') || lower.includes('returning') || lower.includes('create table') || lower.includes('alter table') || lower.includes('drop table')) {
    return 'dml';
  }
  if (lower.includes('over (')) {
    return 'advanced';
  }
  if (lower.includes(' join ') || lower.includes('left join') || lower.includes('right join') || lower.includes('full outer') || lower.includes('cross join')) {
    return 'joins';
  }
  if (lower.includes('group by') || lower.includes('having') || lower.includes('avg(') || lower.includes('sum(') || lower.includes('count(') || lower.includes('min(') || lower.includes('max(')) {
    return 'aggregation';
  }
  if (lower.includes('(select') || lower.includes('exists (select') || lower.includes('in (select') || lower.includes('with ') || lower.includes('lateral')) {
    return 'subqueries';
  }
  if (lower.includes('select') || lower.includes('where') || lower.includes('order by') || lower.includes('limit') || lower.includes('distinct') || lower.includes('case when') || lower.includes('coalesce')) {
    return 'select';
  }
  return 'select';
}

export interface StudentSkillBreakdown {
  user_id: string;
  name: string;
  email: string;
  skills: Record<string, { completed: number; total: number; score: number }>;
  overall_score: number;
}

export function getStudentSkillBreakdown(): StudentSkillBreakdown[] {
  const db = getDb();
  const categories = buildTaskSkillCategories();

  const students = db.prepare(`
    SELECT u.id as user_id, u.name, u.email
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.name
  `).all() as { user_id: string; name: string; email: string }[];

  const result: StudentSkillBreakdown[] = [];

  for (const student of students) {
    const completedTasks = db.prepare(`
      SELECT task_id FROM user_progress WHERE user_id = ?
    `).all(student.user_id) as { task_id: string }[];

    const completedSet = new Set(completedTasks.map(t => t.task_id));
    const skills: Record<string, { completed: number; total: number; score: number }> = {};
    let totalCompleted = 0;
    let totalAvailable = 0;

    for (const cat of categories) {
      const completed = cat.taskIds.filter(id => completedSet.has(id)).length;
      const score = cat.totalTasks > 0 ? Math.round((completed / cat.totalTasks) * 100) : 0;
      skills[cat.name] = { completed, total: cat.totalTasks, score };
      totalCompleted += completed;
      totalAvailable += cat.totalTasks;
    }

    result.push({
      user_id: student.user_id,
      name: student.name,
      email: student.email,
      skills,
      overall_score: totalAvailable > 0 ? Math.round((totalCompleted / totalAvailable) * 100) : 0,
    });
  }

  return result;
}

// ==================== Task Completion Funnel ====================

export interface FunnelStage {
  difficulty: string;
  label: string;
  total_tasks: number;
  students_started: number;
  students_completed_all: number;
  completion_rate: number;
  conversion_from_previous: number | null;
}

export function getTaskCompletionFunnel(filters?: TimeRangeFilters): FunnelStage[] {
  const db = getDb();
  const difficulties = [
    { key: 'beginner', tasks: 8 },
    { key: 'intermediate', tasks: 23 },
    { key: 'advanced', tasks: 25 },
  ];
  const analyticsDifficulties = [
    { prefix: 'analytics-b', tasks: 5 },
    { prefix: 'analytics-i', tasks: 5 },
    { prefix: 'analytics-a', tasks: 5 },
  ];
  const shopDifficulties = [
    { prefix: 'shop-b', tasks: 7 },
    { prefix: 'shop-i', tasks: 6 },
    { prefix: 'shop-a', tasks: 6 },
  ];
  const examDifficulties = [
    { prefix: 'exam-b', tasks: 5 },
    { prefix: 'exam-i', tasks: 5 },
    { prefix: 'exam-a', tasks: 5 },
  ];

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const totalStudents = (db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number }).count;

  const result: FunnelStage[] = [];
  let previousCompleted = totalStudents;

  const groups = [
    { label: 'beginner', key: 'beginner', patterns: [
      { prefix: 'beginner-', tasks: 8 },
      { prefix: 'analytics-b', tasks: 5 },
      { prefix: 'shop-b', tasks: 7 },
      { prefix: 'exam-b', tasks: 5 },
    ]},
    { label: 'intermediate', key: 'intermediate', patterns: [
      { prefix: 'intermediate-', tasks: 23 },
      { prefix: 'analytics-i', tasks: 5 },
      { prefix: 'shop-i', tasks: 6 },
      { prefix: 'exam-i', tasks: 5 },
    ]},
    { label: 'advanced', key: 'advanced', patterns: [
      { prefix: 'advanced-', tasks: 25 },
      { prefix: 'analytics-a', tasks: 5 },
      { prefix: 'shop-a', tasks: 6 },
      { prefix: 'exam-a', tasks: 5 },
    ]},
  ];

  for (const group of groups) {
    const patternPlaceholders = group.patterns.map(() => `task_id LIKE ?`).join(' OR ');
    const patternParams = group.patterns.map(p => `${p.prefix}%`);
    const totalTasksInGroup = group.patterns.reduce((sum, p) => sum + p.tasks, 0);

    const started = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_progress
      WHERE ${patternPlaceholders}${dateCondition}
    `).get(...patternParams, ...dateParams) as { count: number };

    const completedAll = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id
        FROM user_progress
        WHERE ${patternPlaceholders}${dateCondition}
        GROUP BY user_id
        HAVING COUNT(DISTINCT task_id) >= ?
      )
    `).get(...patternParams, ...dateParams, totalTasksInGroup) as { count: number };

    result.push({
      difficulty: group.key,
      label: group.key,
      total_tasks: totalTasksInGroup,
      students_started: started.count,
      students_completed_all: completedAll.count,
      completion_rate: started.count > 0
        ? Math.round((completedAll.count / started.count) * 1000) / 10
        : 0,
      conversion_from_previous: previousCompleted > 0
        ? Math.round((started.count / previousCompleted) * 1000) / 10
        : null,
    });

    previousCompleted = completedAll.count;
  }

  return result;
}

// ==================== Mastery Progression Over Time ====================

export interface MasteryWeekEntry {
  week_start: string;
  timestamp: number;
  skills: Record<string, number>;
  overall: number;
  student_count: number;
}

export function getMasteryProgression(weeks: number = 12, filters?: TimeRangeFilters): MasteryWeekEntry[] {
  const db = getDb();
  const now = Date.now();
  const cutoff = now - weeks * 7 * 24 * 60 * 60 * 1000;
  const categories = buildTaskSkillCategories();

  let effectiveCutoff = cutoff;
  if (filters?.start_date && filters.start_date > cutoff) {
    effectiveCutoff = filters.start_date;
  }

  let query = `
    SELECT
      date(completed_at / 1000, 'unixepoch', 'weekday 0') as week_start,
      user_id,
      task_id
    FROM user_progress
    WHERE completed_at >= ?
  `;
  const params: any[] = [effectiveCutoff];

  if (filters?.end_date) {
    query += ' AND completed_at <= ?';
    params.push(filters.end_date);
  }

  query += ' ORDER BY week_start';

  const weeklyData = db.prepare(query).all(...params) as { week_start: string; user_id: string; task_id: string }[];

  const weekMap = new Map<string, { userTasks: Map<string, Set<string>> }>();
  for (const row of weeklyData) {
    if (!weekMap.has(row.week_start)) {
      weekMap.set(row.week_start, { userTasks: new Map() });
    }
    const week = weekMap.get(row.week_start);
    if (!week) continue;
    if (!week.userTasks.has(row.user_id)) {
      week.userTasks.set(row.user_id, new Set());
    }
    const userSet = week.userTasks.get(row.user_id);
    if (userSet) userSet.add(row.task_id);
  }

  const result: MasteryWeekEntry[] = [];

  for (const [weekStart, data] of weekMap) {
    const ts = new Date(weekStart).getTime();
    const skills: Record<string, number> = {};
    let overallSum = 0;

    for (const cat of categories) {
      let totalScore = 0;
      for (const [, tasks] of data.userTasks) {
        const completed = cat.taskIds.filter(id => tasks.has(id)).length;
        totalScore += cat.totalTasks > 0 ? (completed / cat.totalTasks) * 100 : 0;
      }
      skills[cat.name] = data.userTasks.size > 0
        ? Math.round((totalScore / data.userTasks.size) * 10) / 10
        : 0;
      overallSum += skills[cat.name];
    }

    result.push({
      week_start: weekStart,
      timestamp: ts,
      skills,
      overall: categories.length > 0
        ? Math.round((overallSum / categories.length) * 10) / 10
        : 0,
      student_count: data.userTasks.size,
    });
  }

  return result.sort((a, b) => a.timestamp - b.timestamp);
}

// ==================== Deadlines & Reminders ====================

export interface Deadline {
  id: string;
  creator_id: string;
  type: 'course' | 'exam' | 'task' | 'inactivity';
  title: string;
  description: string | null;
  target_type: 'individual' | 'group' | 'all_students';
  target_id: string | null;
  task_id: string | null;
  due_at: number;
  created_at: number;
  updated_at: number;
}

export interface PendingReminder {
  id: string;
  deadline_id: string;
  type: 'course' | 'exam' | 'task' | 'inactivity';
  title: string;
  description: string | null;
  task_id: string | null;
  due_at: number;
  is_overdue: boolean;
  hours_until_due: number;
}

export interface PushSubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: number;
  last_used: number | null;
}

export function createDeadline(data: {
  creatorId: string;
  type: Deadline['type'];
  title: string;
  description?: string;
  targetType: Deadline['target_type'];
  targetId?: string;
  taskId?: string;
  dueAt: number;
}, actorId?: string): Deadline {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO deadlines (id, creator_id, type, title, description, target_type, target_id, task_id, due_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.creatorId, data.type, data.title, data.description || null, data.targetType, data.targetId || null, data.taskId || null, data.dueAt, now, now);
  if (actorId) {
    logAudit(actorId, 'deadline_created', 'deadline', id, JSON.stringify({ title: data.title, type: data.type, dueAt: data.dueAt }));
  }
  return getDeadlineById(id)!;
}

export function getDeadlineById(id: string): Deadline | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM deadlines WHERE id = ?').get(id) as Deadline | undefined;
}

export function getDeadlinesForCreator(creatorId: string): Deadline[] {
  const db = getDb();
  return db.prepare('SELECT * FROM deadlines WHERE creator_id = ? ORDER BY due_at ASC').all(creatorId) as Deadline[];
}

export function getAllDeadlines(): Deadline[] {
  const db = getDb();
  return db.prepare('SELECT * FROM deadlines ORDER BY due_at ASC').all() as Deadline[];
}

export function updateDeadline(id: string, data: {
  title?: string;
  description?: string;
  type?: Deadline['type'];
  targetType?: Deadline['target_type'];
  targetId?: string;
  taskId?: string;
  dueAt?: number;
}, creatorId: string, actorId?: string): boolean {
  const db = getDb();
  const existing = getDeadlineById(id);
  if (!existing) return false;
  if (existing.creator_id !== creatorId) {
    const db2 = getDb();
    const user = db2.prepare('SELECT role FROM users WHERE id = ?').get(creatorId) as { role: string } | undefined;
    if (user?.role !== 'admin') return false;
  }
  const fields: string[] = [];
  const values: any[] = [];
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.targetType !== undefined) { fields.push('target_type = ?'); values.push(data.targetType); }
  if (data.targetId !== undefined) { fields.push('target_id = ?'); values.push(data.targetId); }
  if (data.taskId !== undefined) { fields.push('task_id = ?'); values.push(data.taskId); }
  if (data.dueAt !== undefined) { fields.push('due_at = ?'); values.push(data.dueAt); }
  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);
  db.prepare(`UPDATE deadlines SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  if (actorId) {
    logAudit(actorId, 'deadline_updated', 'deadline', id, JSON.stringify(data));
  }
  return true;
}

export function deleteDeadline(id: string, creatorId: string, actorId?: string): boolean {
  const db = getDb();
  const existing = getDeadlineById(id);
  if (!existing) return false;
  if (existing.creator_id !== creatorId) {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(creatorId) as { role: string } | undefined;
    if (user?.role !== 'admin') return false;
  }
  db.prepare('DELETE FROM deadlines WHERE id = ?').run(id);
  if (actorId) {
    logAudit(actorId, 'deadline_deleted', 'deadline', id, JSON.stringify({ title: existing.title }));
  }
  return true;
}

export function getPendingReminders(userId: string): PendingReminder[] {
  const db = getDb();
  const now = Date.now();

  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
  if (!user) return [];

  let query = `
    SELECT d.* FROM deadlines d
    WHERE d.due_at <= ? + 86400000
    AND d.id NOT IN (
      SELECT deadline_id FROM reminder_log WHERE user_id = ? AND channel = 'in_app'
    )
  `;
  const params: any[] = [now, userId];

  if (user.role === 'student') {
    query += ` AND (
      d.target_type = 'all_students'
      OR (d.target_type = 'individual' AND d.target_id = ?)
    )`;
    params.push(userId);
  }

  query += ' ORDER BY d.due_at ASC';

  const deadlines = db.prepare(query).all(...params) as Deadline[];

  const inactivityDeadline = db.prepare(`
    SELECT d.* FROM deadlines d
    WHERE d.type = 'inactivity' AND d.due_at <= ? + 86400000
    AND d.id NOT IN (
      SELECT deadline_id FROM reminder_log WHERE user_id = ? AND channel = 'inactivity_warning'
    )
    AND (d.target_type = 'all_students' OR (d.target_type = 'individual' AND d.target_id = ?))
    ORDER BY d.due_at ASC
  `).all(now, userId, userId) as Deadline[];

  const allDeadlines = [...deadlines];
  for (const inc of inactivityDeadline) {
    if (!allDeadlines.find(d => d.id === inc.id)) {
      allDeadlines.push(inc);
    }
  }

  return allDeadlines.map(d => ({
    id: d.id,
    deadline_id: d.id,
    type: d.type,
    title: d.title,
    description: d.description,
    task_id: d.task_id,
    due_at: d.due_at,
    is_overdue: d.due_at < now,
    hours_until_due: Math.round((d.due_at - now) / 3600000),
  }));
}

export function logReminderDelivery(
  deadlineId: string,
  userId: string,
  channel: string,
  status: string = 'sent',
  error?: string,
): void {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT OR IGNORE INTO reminder_log (id, deadline_id, user_id, channel, sent_at, status, error)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, deadlineId, userId, channel, Date.now(), status, error || null);
}

export function savePushSubscription(userId: string, subscription: { endpoint: string; p256dh: string; auth: string }): void {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at, last_used)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, subscription.endpoint, subscription.p256dh, subscription.auth, now, now);
}

export function getUserPushSubscriptions(userId: string): PushSubRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId) as PushSubRow[];
}

export function deletePushSubscription(userId: string, endpoint: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(userId, endpoint);
  return result.changes > 0;
}

export function getAllPushSubscriptions(): PushSubRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM push_subscriptions').all() as PushSubRow[];
}

// ==================== Notification Preferences ====================

export interface NotificationPreferences {
  user_id: string;
  channels_enabled: string; // JSON array: ["in_app", "push", "email"]
  reminder_intervals: string; // JSON array of ms: [86400000, 3600000]
  teacher_notify_students: number; // 0 or 1
  updated_at: number;
}

export const DEFAULT_CHANNELS = JSON.stringify(['in_app']);
export const DEFAULT_INTERVALS = JSON.stringify([86400000, 3600000]); // 24h, 1h

export function getNotificationPreferences(userId: string): NotificationPreferences {
  const db = getDb();
  const prefs = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId) as NotificationPreferences | undefined;
  if (prefs) return prefs;

  // Create defaults
  db.prepare(`
    INSERT INTO notification_preferences (user_id, channels_enabled, reminder_intervals, teacher_notify_students, updated_at)
    VALUES (?, ?, ?, 1, ?)
  `).run(userId, DEFAULT_CHANNELS, DEFAULT_INTERVALS, Date.now());

  return {
    user_id: userId,
    channels_enabled: DEFAULT_CHANNELS,
    reminder_intervals: DEFAULT_INTERVALS,
    teacher_notify_students: 1,
    updated_at: Date.now(),
  };
}

export function updateNotificationPreferences(userId: string, prefs: {
  channels_enabled?: string[];
  reminder_intervals?: number[];
  teacher_notify_students?: boolean;
}): void {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId) as NotificationPreferences | undefined;

  const channels = prefs.channels_enabled || (existing ? JSON.parse(existing.channels_enabled) : ['in_app']);
  const intervals = prefs.reminder_intervals || (existing ? JSON.parse(existing.reminder_intervals) : [86400000, 3600000]);
  const notifyStudents = prefs.teacher_notify_students !== undefined ? (prefs.teacher_notify_students ? 1 : 0) : (existing?.teacher_notify_students ?? 1);

  db.prepare(`
    INSERT INTO notification_preferences (user_id, channels_enabled, reminder_intervals, teacher_notify_students, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      channels_enabled = excluded.channels_enabled,
      reminder_intervals = excluded.reminder_intervals,
      teacher_notify_students = excluded.teacher_notify_students,
      updated_at = excluded.updated_at
  `).run(userId, JSON.stringify(channels), JSON.stringify(intervals), notifyStudents, Date.now());
}

// ==================== Reminder Schedule ====================

export interface ReminderScheduleRow {
  id: string;
  deadline_id: string;
  user_id: string;
  channel: string;
  trigger_at: number;
  status: string;
  sent_at: number | null;
  error: string | null;
}

/**
 * Given a deadline, returns the list of student user_ids it applies to.
 */
export function resolveDeadlineTargets(deadline: Deadline): string[] {
  const db = getDb();

  if (deadline.target_type === 'all_students') {
    const rows = db.prepare("SELECT id FROM users WHERE role = 'student'").all() as { id: string }[];
    return rows.map(r => r.id);
  }

  if (deadline.target_type === 'individual' && deadline.target_id) {
    return [deadline.target_id];
  }

  if (deadline.target_type === 'group' && deadline.target_id) {
    // Group targeting: users whose name/email matches the group identifier
    // For simplicity, treat group as individual for now
    return [deadline.target_id];
  }

  return [];
}

/**
 * Builds reminder schedule entries for a deadline: target users x intervals x channels.
 * Called when a deadline is created or updated.
 */
export function buildReminderSchedule(deadlineId: string): void {
  const db = getDb();
  const deadline = getDeadlineById(deadlineId);
  if (!deadline) return;

  const targets = resolveDeadlineTargets(deadline);
  if (targets.length === 0) return;

  // Get default intervals and channels (use creator's preferences as default)
  const creatorPrefs = getNotificationPreferences(deadline.creator_id);
  const intervals: number[] = JSON.parse(creatorPrefs.reminder_intervals);
  const channels: string[] = JSON.parse(creatorPrefs.channels_enabled);

  const now = Date.now();

  // Delete existing schedule for this deadline (in case of update)
  db.prepare('DELETE FROM reminder_schedule WHERE deadline_id = ?').run(deadlineId);

  // Build schedule entries
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO reminder_schedule (id, deadline_id, user_id, channel, trigger_at, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);

  const insertMany = db.transaction((entries: Array<{ id: string; deadline_id: string; user_id: string; channel: string; trigger_at: number }>) => {
    for (const entry of entries) {
      stmt.run(entry.id, entry.deadline_id, entry.user_id, entry.channel, entry.trigger_at);
    }
  });

  const entries: Array<{ id: string; deadline_id: string; user_id: string; channel: string; trigger_at: number }> = [];

  for (const userId of targets) {
    // Also get this user's preferences to filter channels
    const userPrefs = getNotificationPreferences(userId);
    const userChannels: string[] = JSON.parse(userPrefs.channels_enabled);
    const userIntervals: number[] = JSON.parse(userPrefs.reminder_intervals);

    // Use the intersection of creator channels and user channels
    const effectiveChannels = channels.filter(c => userChannels.includes(c));
    // Use the intersection of creator intervals and user intervals
    const effectiveIntervals = intervals.filter(i => userIntervals.includes(i));

    for (const intervalMs of effectiveIntervals) {
      const triggerAt = deadline.due_at - intervalMs;
      // Skip if trigger time is in the past
      if (triggerAt < now) continue;

      for (const channel of effectiveChannels) {
        entries.push({
          id: crypto.randomUUID(),
          deadline_id: deadlineId,
          user_id: userId,
          channel,
          trigger_at: triggerAt,
        });
      }
    }
  }

  if (entries.length > 0) {
    insertMany(entries);
  }
}

/**
 * Returns all schedule rows where trigger_at <= now AND status = 'pending'.
 */
export function getDueReminders(): ReminderScheduleRow[] {
  const db = getDb();
  const now = Date.now();
  return db.prepare(`
    SELECT * FROM reminder_schedule
    WHERE trigger_at <= ? AND status = 'pending'
    ORDER BY trigger_at ASC
  `).all(now) as ReminderScheduleRow[];
}

export function markScheduleSent(id: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE reminder_schedule SET status = 'sent', sent_at = ? WHERE id = ?
  `).run(Date.now(), id);
}

export function markScheduleFailed(id: string, error: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE reminder_schedule SET status = 'failed', error = ? WHERE id = ?
  `).run(error, id);
}

/**
 * Returns the creator (teacher) of a deadline.
 */
export function getTeachersForDeadline(deadlineId: string): { id: string; email: string; name: string }[] {
  const db = getDb();
  const deadline = getDeadlineById(deadlineId);
  if (!deadline) return [];

  const teacher = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(deadline.creator_id) as { id: string; email: string; name: string } | undefined;
  return teacher ? [teacher] : [];
}

/**
 * Get teacher notification deadlines: deadlines created by a teacher that are approaching.
 */
export function getTeacherNotificationDeadlines(teacherId: string, withinMs: number = 86400000): Array<{
  deadline: Deadline;
  target_count: number;
  reminders_sent: number;
  completions: number;
}> {
  const db = getDb();
  const now = Date.now();

  const deadlines = db.prepare(`
    SELECT * FROM deadlines
    WHERE creator_id = ? AND due_at > ? AND due_at <= ? + ?
    ORDER BY due_at ASC
  `).all(teacherId, now, now, withinMs) as Deadline[];

  return deadlines.map(d => {
    const targets = resolveDeadlineTargets(d);
    const sent = db.prepare(`
      SELECT COUNT(*) as cnt FROM reminder_schedule
      WHERE deadline_id = ? AND status = 'sent'
    `).get(d.id) as { cnt: number };
    const completions = db.prepare(`
      SELECT COUNT(*) as cnt FROM user_progress
      WHERE task_id IS NOT NULL AND task_id IN (
        SELECT task_id FROM deadlines WHERE id = ?
      )
    `).get(d.id) as { cnt: number };

    return {
      deadline: d,
      target_count: targets.length,
      reminders_sent: sent.cnt,
      completions: completions.cnt,
    };
  });
}

// ==================== Email Queue ====================

export interface EmailQueueRow {
  id: string;
  user_id: string;
  subject: string;
  body_html: string;
  scheduled_at: number;
  status: string;
  attempts: number;
  max_attempts: number;
  error: string | null;
  created_at: number;
}

export function queueEmail(userId: string, subject: string, bodyHtml: string, scheduledAt: number = Date.now()): string {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO email_queue (id, user_id, subject, body_html, scheduled_at, status, attempts, max_attempts, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', 0, 3, ?)
  `).run(id, userId, subject, bodyHtml, scheduledAt, Date.now());
  return id;
}

export function getDueEmails(): EmailQueueRow[] {
  const db = getDb();
  const now = Date.now();
  return db.prepare(`
    SELECT * FROM email_queue
    WHERE scheduled_at <= ? AND status = 'pending' AND attempts < max_attempts
    ORDER BY scheduled_at ASC
    LIMIT 50
  `).all(now) as EmailQueueRow[];
}

export function markEmailSent(id: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE email_queue SET status = 'sent', attempts = attempts + 1 WHERE id = ?
  `).run(id);
}

export function markEmailFailed(id: string, error: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE email_queue SET status = 'pending', attempts = attempts + 1, error = ? WHERE id = ?
  `).run(error, id);
}

// ==================== System Health ====================

export interface SystemHealth {
  db_size_bytes: number;
  db_wal_size_bytes: number;
  total_users: number;
  total_progress_entries: number;
  total_achievements: number;
  active_today: number;
  active_this_week: number;
  completions_today: number;
  completions_this_week: number;
  db_connection_status: 'healthy' | 'degraded' | 'error';
  last_24h_activity: { hour: string; completions: number; users: number }[];
}

export function getSystemHealth(): SystemHealth {
  const db = getDb();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  try {
    db.prepare("SELECT 1").get();

    const dbStats = getDBStats();
    const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
    const totalProgress = (db.prepare("SELECT COUNT(*) as c FROM user_progress").get() as { c: number }).c;
    const totalAchievements = (db.prepare("SELECT COUNT(*) as c FROM user_achievements").get() as { c: number }).c;

    const activeToday = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as c FROM user_progress WHERE completed_at >= ?
    `).get(oneDayAgo) as { c: number }).c;

    const activeThisWeek = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as c FROM user_progress WHERE completed_at >= ?
    `).get(oneWeekAgo) as { c: number }).c;

    const completionsToday = (db.prepare(`
      SELECT COUNT(*) as c FROM user_progress WHERE completed_at >= ?
    `).get(oneDayAgo) as { c: number }).c;

    const completionsThisWeek = (db.prepare(`
      SELECT COUNT(*) as c FROM user_progress WHERE completed_at >= ?
    `).get(oneWeekAgo) as { c: number }).c;

    // Hourly activity for last 24 hours
    const hourlyActivity = db.prepare(`
      SELECT
        strftime('%H', datetime(completed_at / 1000, 'unixepoch')) as hour,
        COUNT(*) as completions,
        COUNT(DISTINCT user_id) as users
      FROM user_progress
      WHERE completed_at >= ?
      GROUP BY hour
      ORDER BY hour
    `).all(oneDayAgo) as { hour: string; completions: number; users: number }[];

    // Fill in missing hours
    const hourMap = new Map(hourlyActivity.map(h => [h.hour, h]));
    const last24h: { hour: string; completions: number; users: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const h = String(i).padStart(2, '0');
      last24h.push(hourMap.get(h) || { hour: h, completions: 0, users: 0 });
    }

    const dbPath = path.join(process.cwd(), 'data', 'users.db');
    const walPath = dbPath + '-wal';
    let walSize = 0;
    try { walSize = fs.statSync(walPath).size; } catch { walSize = 0; }

    return {
      db_size_bytes: dbStats.dbSizeBytes,
      db_wal_size_bytes: walSize,
      total_users: totalUsers,
      total_progress_entries: totalProgress,
      total_achievements: totalAchievements,
      active_today: activeToday,
      active_this_week: activeThisWeek,
      completions_today: completionsToday,
      completions_this_week: completionsThisWeek,
      db_connection_status: 'healthy',
      last_24h_activity: last24h,
    };
  } catch (error) {
    console.error('[SystemHealth] DB check failed:', error);
    return {
      db_size_bytes: 0,
      db_wal_size_bytes: 0,
      total_users: 0,
      total_progress_entries: 0,
      total_achievements: 0,
      active_today: 0,
      active_this_week: 0,
      completions_today: 0,
      completions_this_week: 0,
      db_connection_status: 'error',
      last_24h_activity: [],
    };
  }
}

export interface GradeDistributionEntry {
  bracket: string;
  min_score: number;
  max_score: number;
  student_count: number;
  percentage: number;
}

export function getStudentGradeDistribution(filters?: TimeRangeFilters): GradeDistributionEntry[] {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const totalStudents = (db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM user_progress WHERE 1=1${dateCondition}`).get(...dateParams) as { c: number }).c || 1;

  const brackets = [
    { label: '0–10%', min: 0, max: 10 },
    { label: '10–20%', min: 10, max: 20 },
    { label: '20–30%', min: 20, max: 30 },
    { label: '30–40%', min: 30, max: 40 },
    { label: '40–50%', min: 40, max: 50 },
    { label: '50–60%', min: 50, max: 60 },
    { label: '60–70%', min: 60, max: 70 },
    { label: '70–80%', min: 70, max: 80 },
    { label: '80–90%', min: 80, max: 90 },
    { label: '90–100%', min: 90, max: 100 },
  ];

  const totalTasks = (db.prepare("SELECT COUNT(*) as c FROM training_tasks").get() as { c: number }).c || 56;

  return brackets.map((b) => {
    const row = db.prepare(`
      SELECT COUNT(*) as c FROM (
        SELECT user_id, COUNT(*) as completed
        FROM user_progress
        WHERE 1=1${dateCondition}
        GROUP BY user_id
        HAVING (completed * 100.0 / ?) >= ? AND (completed * 100.0 / ?) < ?
      )
    `).get(...dateParams, totalTasks, b.min, totalTasks, b.max) as { c: number };
    return {
      bracket: b.label,
      min_score: b.min,
      max_score: b.max,
      student_count: row.c,
      percentage: Math.round((row.c / totalStudents) * 100),
    };
  });
}

export interface GrowthTrendEntry {
  week_start: string;
  week_label: string;
  new_users: number;
  active_users: number;
  total_users: number;
}

export function getStudentGrowthTrends(weeks: number = 12, filters?: TimeRangeFilters): GrowthTrendEntry[] {
  const db = getDb();
  const now = Date.now();
  const result: GrowthTrendEntry[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
    const weekStart = weekEnd - 7 * 24 * 60 * 60 * 1000;

    let userDateCondition = '';
    const userDateParams: any[] = [weekStart, weekEnd];
    if (filters?.start_date) {
      userDateCondition += ' AND created_at >= ?';
      userDateParams.push(filters.start_date);
    }
    if (filters?.end_date) {
      userDateCondition += ' AND created_at <= ?';
      userDateParams.push(filters.end_date);
    }

    const newUsers = (db.prepare(`
      SELECT COUNT(*) as c FROM users WHERE created_at >= ? AND created_at < ?${userDateCondition}
    `).get(...userDateParams) as { c: number }).c;

    let progressDateCondition = '';
    const progressDateParams: any[] = [weekStart, weekEnd];
    if (filters?.start_date) {
      progressDateCondition += ' AND completed_at >= ?';
      progressDateParams.push(filters.start_date);
    }
    if (filters?.end_date) {
      progressDateCondition += ' AND completed_at <= ?';
      progressDateParams.push(filters.end_date);
    }

    const activeUsers = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as c FROM user_progress WHERE completed_at >= ? AND completed_at < ?${progressDateCondition}
    `).get(...progressDateParams) as { c: number }).c;

    const totalUsers = (db.prepare(`
      SELECT COUNT(*) as c FROM users WHERE created_at < ?
    `).get(weekEnd) as { c: number }).c;

    const weekDate = new Date(weekStart);
    const month = weekDate.toLocaleDateString('en-US', { month: 'short' });
    const day = weekDate.getDate();

    result.push({
      week_start: new Date(weekStart).toISOString(),
      week_label: `${month} ${day}`,
      new_users: newUsers,
      active_users: activeUsers,
      total_users: totalUsers,
    });
  }

  return result;
}

// ==================== Cohort Comparison ====================

export interface CohortComparisonEntry {
  cohort_name: string;
  student_count: number;
  avg_completion_rate: number;
  avg_attempts: number;
  avg_velocity: number;
  avg_engagement_score: number;
}

export function getCohortComparison(): { cohorts: CohortComparisonEntry[] } {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cohortDefs = [
    { name: 'Last 30 days', start: now - 30 * dayMs, end: now },
    { name: '30-90 days ago', start: now - 90 * dayMs, end: now - 30 * dayMs },
    { name: '90-180 days ago', start: now - 180 * dayMs, end: now - 90 * dayMs },
    { name: '180+ days ago', start: 0, end: now - 180 * dayMs },
  ];

  const cohorts = cohortDefs.map(cohort => {
    const students = db.prepare(`
      SELECT u.id, u.created_at, u.last_active,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id) as tasks_completed,
        (SELECT AVG(attempts) FROM user_progress WHERE user_id = u.id) as avg_attempts
      FROM users u
      WHERE u.role = 'student' AND u.created_at >= ? AND u.created_at < ?
    `).all(cohort.start, cohort.end) as Array<{
      id: string;
      created_at: number;
      last_active: number | null;
      tasks_completed: number;
      avg_attempts: number | null;
    }>;

    if (students.length === 0) {
      return {
        cohort_name: cohort.name,
        student_count: 0,
        avg_completion_rate: 0,
        avg_attempts: 0,
        avg_velocity: 0,
        avg_engagement_score: 0,
      };
    }

    const rates = students.map(s => {
      const completionRate = Math.min((s.tasks_completed / TRAINING_TASKS.length) * 100, 100);
      const daysSinceCreated = (now - s.created_at) / dayMs;
      const weeksSinceCreated = daysSinceCreated / 7;
      const velocity = weeksSinceCreated > 0 ? s.tasks_completed / weeksSinceCreated : s.tasks_completed;
      const daysSinceActive = s.last_active ? (now - s.last_active) / dayMs : 999;
      const recencyScore = Math.max(0, 100 - (daysSinceActive * 5));
      const consistencyScore = daysSinceCreated > 0 ? Math.min((s.tasks_completed / daysSinceCreated) * 10, 100) : 0;
      const engagementScore = (completionRate * 0.4) + (recencyScore * 0.3) + (consistencyScore * 0.3);

      return { completionRate, velocity: Math.round(velocity * 10) / 10, engagementScore: Math.round(engagementScore) };
    });

    return {
      cohort_name: cohort.name,
      student_count: students.length,
      avg_completion_rate: Math.round((rates.reduce((sum, r) => sum + r.completionRate, 0) / students.length) * 10) / 10,
      avg_attempts: Math.round((students.reduce((sum, s) => sum + (s.avg_attempts || 0), 0) / students.length) * 10) / 10,
      avg_velocity: Math.round((rates.reduce((sum, r) => sum + r.velocity, 0) / students.length) * 10) / 10,
      avg_engagement_score: Math.round(rates.reduce((sum, r) => sum + r.engagementScore, 0) / students.length),
    };
  });

  return { cohorts };
}

// ==================== Error Trend Analysis ====================

export interface ErrorTrendEntry {
  date: string;
  total_completions: number;
  high_attempt_completions: number;
  high_attempt_rate: number;
  avg_attempts: number;
}

export function getErrorTrendAnalysis(days: number = 90, filters?: TimeRangeFilters): ErrorTrendEntry[] {
  const db = getDb();
  let cutoff: number;
  if (filters?.start_date) {
    cutoff = filters.start_date;
  } else {
    cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  }

  let query = `
    SELECT
      date(completed_at / 1000, 'unixepoch') as day,
      COUNT(*) as total_completions,
      SUM(CASE WHEN attempts > 3 THEN 1 ELSE 0 END) as high_attempt_completions,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts
    FROM user_progress
    WHERE completed_at >= ?
  `;
  const params: any[] = [cutoff];

  if (filters?.end_date) {
    query += ' AND completed_at <= ?';
    params.push(filters.end_date);
  }

  query += ' GROUP BY day ORDER BY day';

  const rows = db.prepare(query).all(...params) as {
    day: string;
    total_completions: number;
    high_attempt_completions: number;
    avg_attempts: number;
  }[];

  const endDate = filters?.end_date ? new Date(filters.end_date) : new Date();
  const startDate = filters?.start_date ? new Date(filters.start_date) : new Date(cutoff);
  const current = new Date(startDate);
  const result: ErrorTrendEntry[] = [];

  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const existing = rows.find(r => r.day === dateStr);
    result.push({
      date: dateStr,
      total_completions: existing?.total_completions || 0,
      high_attempt_completions: existing?.high_attempt_completions || 0,
      high_attempt_rate: existing ? Math.round((existing.high_attempt_completions / existing.total_completions) * 1000) / 10 : 0,
      avg_attempts: existing?.avg_attempts || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// ==================== Student Learning Timeline ====================

export interface TimelineEntry {
  task_id: string;
  completed_at: number;
  attempts: number;
  cumulative_count: number;
  difficulty: string;
}

export function getStudentLearningTimeline(userId: string): {
  student: { name: string; email: string; tasks_completed: number } | null;
  timeline: TimelineEntry[];
} {
  const db = getDb();
  const student = db.prepare(`
    SELECT u.name, u.email,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id) as tasks_completed
    FROM users u WHERE u.id = ? AND u.role = 'student'
  `).get(userId) as { name: string; email: string; tasks_completed: number } | undefined;

  if (!student) return { student: null, timeline: [] };

  const progress = db.prepare(`
    SELECT task_id, completed_at, attempts FROM user_progress
    WHERE user_id = ? ORDER BY completed_at ASC
  `).all(userId) as { task_id: string; completed_at: number; attempts: number }[];

  const timeline: TimelineEntry[] = progress.map((p, i) => ({
    task_id: p.task_id,
    completed_at: p.completed_at,
    attempts: p.attempts,
    cumulative_count: i + 1,
    difficulty: p.task_id.startsWith('beginner-') ? 'beginner'
      : p.task_id.startsWith('intermediate-') ? 'intermediate'
      : p.task_id.startsWith('advanced-') ? 'advanced'
      : 'other',
  }));

  return { student, timeline };
}

export interface LearningPaceEntry {
  user_id: string;
  name: string;
  email: string;
  avg_minutes_between_tasks: number;
  pace_trend: 'accelerating' | 'decelerating' | 'stable';
  estimated_hours_to_complete: number;
  recent_velocity: number;
  total_tasks_completed: number;
}

export function getStudentLearningPace(filters?: TimeRangeFilters): LearningPaceEntry[] {
  const db = getDb();
  const students = db.prepare(`
    SELECT u.id, u.name, u.email, 
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id) as tasks_completed
    FROM users u WHERE u.role = 'student'
  `).all() as { id: string; name: string; email: string; tasks_completed: number }[];

  return students.map(student => {
    let query = 'SELECT completed_at FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC';
    const params: any[] = [student.id];
    if (filters?.start_date) {
      query += ' AND completed_at >= ?';
      params.push(filters.start_date);
    }
    if (filters?.end_date) {
      query += ' AND completed_at <= ?';
      params.push(filters.end_date);
    }
    const progress = db.prepare(query).all(...params) as { completed_at: number }[];

    const gaps: number[] = [];
    for (let i = 1; i < progress.length; i++) {
      const gapMinutes = (progress[i].completed_at - progress[i-1].completed_at) / (60 * 1000);
      if (gapMinutes > 0 && gapMinutes < 1440) {
        gaps.push(gapMinutes);
      }
    }

    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const mid = Math.floor(gaps.length / 2);
    const firstHalfAvg = mid > 0 ? gaps.slice(0, mid).reduce((a, b) => a + b, 0) / mid : 0;
    const secondHalfAvg = mid < gaps.length ? gaps.slice(mid).reduce((a, b) => a + b, 0) / (gaps.length - mid) : 0;

    let pace_trend: LearningPaceEntry['pace_trend'] = 'stable';
    if (firstHalfAvg > 0 && secondHalfAvg > 0) {
      if (secondHalfAvg < firstHalfAvg * 0.85) pace_trend = 'accelerating';
      else if (secondHalfAvg > firstHalfAvg * 1.15) pace_trend = 'decelerating';
    }

    const tasksRemaining = TRAINING_TASKS.length - student.tasks_completed;
    const estimated_hours = tasksRemaining > 0 && avgGap > 0 ? Math.round((tasksRemaining * avgGap) / 60 * 10) / 10 : 0;

    const now = Date.now();
    const recentCount = progress.filter(p => p.completed_at >= now - 30 * 24 * 60 * 60 * 1000).length;
    const recent_velocity = Math.round((recentCount / 4) * 10) / 10;

    return {
      user_id: student.id,
      name: student.name || student.email,
      email: student.email,
      avg_minutes_between_tasks: Math.round(avgGap * 10) / 10,
      pace_trend,
      estimated_hours_to_complete: estimated_hours,
      recent_velocity,
      total_tasks_completed: student.tasks_completed,
    };
  }).filter(s => s.total_tasks_completed > 0);
}

// ==================== Task Performance Detail ====================

export interface TaskPerformanceEntry {
  task_id: string;
  task_name: string;
  difficulty: string;
  total_attempts: number;
  unique_students: number;
  avg_attempts: number;
  first_attempt_rate: number;
  completion_rate: number;
  avg_time_minutes: number;
  struggling_students: number;
  success_rate_trend: 'improving' | 'declining' | 'stable';
}

export function getTaskPerformanceDetail(filters?: TimeRangeFilters): TaskPerformanceEntry[] {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };

  const tasks = db.prepare(`
    SELECT
      task_id,
      COUNT(*) as total_attempts,
      COUNT(DISTINCT user_id) as unique_students,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as first_attempt_rate
    FROM user_progress
    WHERE 1=1 ${dateCondition}
    GROUP BY task_id
    ORDER BY task_id
  `).all(...dateParams) as Array<{
    task_id: string;
    total_attempts: number;
    unique_students: number;
    avg_attempts: number;
    first_attempt_rate: number;
  }>;

  // Get recent vs previous period for trend
  const now = Date.now();
  const midPoint = filters?.start_date && filters?.end_date
    ? (filters.start_date + filters.end_date) / 2
    : now - 30 * 24 * 60 * 60 * 1000;

  return tasks.map(task => {
    const recentSuccess = db.prepare(`
      SELECT COUNT(*) as count FROM user_progress
      WHERE task_id = ? AND attempts <= 2 AND completed_at >= ?
    `).get(task.task_id, midPoint) as { count: number };

    const previousSuccess = db.prepare(`
      SELECT COUNT(*) as count FROM user_progress
      WHERE task_id = ? AND attempts <= 2 AND completed_at < ?
    `).get(task.task_id, midPoint) as { count: number };

    let trend: TaskPerformanceEntry['success_rate_trend'] = 'stable';
    if (previousSuccess.count > 0) {
      const change = (recentSuccess.count - previousSuccess.count) / previousSuccess.count;
      if (change > 0.1) trend = 'improving';
      else if (change < -0.1) trend = 'declining';
    }

    const avgTime = db.prepare(`
      SELECT AVG(diff) as avg_minutes FROM (
        SELECT (completed_at - LAG(completed_at) OVER (PARTITION BY user_id ORDER BY completed_at)) / 60000 as diff
        FROM user_progress WHERE task_id = ? AND diff IS NOT NULL AND diff > 0 AND diff < 1440
      )
    `).get(task.task_id) as { avg_minutes: number | null };

    const struggling = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_progress
      WHERE task_id = ? AND attempts > 3
    `).get(task.task_id) as { count: number };

    const difficulty = task.task_id.startsWith('beginner-') ? 'beginner'
      : task.task_id.startsWith('intermediate-') ? 'intermediate'
      : task.task_id.startsWith('advanced-') ? 'advanced' : 'other';

    return {
      task_id: task.task_id,
      task_name: task.task_id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      difficulty,
      total_attempts: task.total_attempts,
      unique_students: task.unique_students,
      avg_attempts: task.avg_attempts,
      first_attempt_rate: task.first_attempt_rate || 0,
      completion_rate: totalStudents.count > 0 ? Math.round((task.unique_students / totalStudents.count) * 1000) / 10 : 0,
      avg_time_minutes: Math.round(avgTime?.avg_minutes || 0),
      struggling_students: struggling.count,
      success_rate_trend: trend,
    };
  });
}

// ==================== Learning Time Patterns ====================

export interface HourlyActivityEntry {
  hour: number;
  completions: number;
  unique_students: number;
  avg_attempts: number;
  success_rate: number;
}

export interface DailyPatternEntry {
  day: string;
  day_name: string;
  completions: number;
  unique_students: number;
  avg_attempts: number;
}

export function getLearningTimePatterns(days: number = 30, filters?: TimeRangeFilters): {
  hourly: HourlyActivityEntry[];
  daily: DailyPatternEntry[];
  peak_hour: number;
  peak_day: string;
} {
  const db = getDb();
  
  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' WHERE completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += dateCondition ? ' AND completed_at <= ?' : ' WHERE completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const hourly = db.prepare(`
    SELECT
      CAST(strftime('%H', datetime(completed_at / 1000, 'unixepoch', 'localtime')) AS INTEGER) as hour,
      COUNT(*) as completions,
      COUNT(DISTINCT user_id) as unique_students,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as success_rate
    FROM user_progress
    ${dateCondition}
    GROUP BY hour
    ORDER BY hour
  `).all(...dateParams) as HourlyActivityEntry[];

  // Fill missing hours with zeros
  const fullHourly: HourlyActivityEntry[] = [];
  for (let h = 0; h < 24; h++) {
    const existing = hourly.find(row => row.hour === h);
    fullHourly.push({
      hour: h,
      completions: existing?.completions || 0,
      unique_students: existing?.unique_students || 0,
      avg_attempts: existing?.avg_attempts || 0,
      success_rate: existing?.success_rate || 0,
    });
  }

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dailyRaw = db.prepare(`
    SELECT
      CAST(strftime('%w', datetime(completed_at / 1000, 'unixepoch', 'localtime')) AS INTEGER) as day_num,
      COUNT(*) as completions,
      COUNT(DISTINCT user_id) as unique_students,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts
    FROM user_progress
    ${dateCondition}
    GROUP BY day_num
    ORDER BY day_num
  `).all(...dateParams) as Array<{ day_num: number; completions: number; unique_students: number; avg_attempts: number }>;

  const daily: DailyPatternEntry[] = [];
  for (let d = 0; d < 7; d++) {
    const existing = dailyRaw.find(row => row.day_num === d);
    daily.push({
      day: String(d),
      day_name: existing ? (dayNames[d] || dayNamesEn[d]) : (dayNames[d] || dayNamesEn[d]),
      completions: existing?.completions || 0,
      unique_students: existing?.unique_students || 0,
      avg_attempts: existing?.avg_attempts || 0,
    });
  }

  const peakHour = fullHourly.reduce((max, h) => h.completions > max.completions ? h : max, fullHourly[0]);
  const peakDay = daily.reduce((max, d) => d.completions > max.completions ? d : max, daily[0]);

  return {
    hourly: fullHourly,
    daily,
    peak_hour: peakHour?.hour || 0,
    peak_day: peakDay?.day || '0',
  };
}

// ==================== Student Groups Analytics ====================

export interface StudentGroupEntry {
  group_name: string;
  student_count: number;
  avg_completion_rate: number;
  avg_attempts: number;
  avg_velocity: number;
  avg_engagement: number;
  tasks_completed: number;
  total_students: number;
}

export function getStudentGroupsAnalytics(): StudentGroupEntry[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Define groups by different criteria
  const groups = [
    { name: 'Active (7 days)', condition: 'last_active >= ?', params: [now - 7 * dayMs] },
    { name: 'Inactive (7+ days)', condition: 'last_active < ? OR last_active IS NULL', params: [now - 7 * dayMs] },
    { name: 'High Performers (>50%)', condition: "id IN (SELECT user_id FROM user_progress GROUP BY user_id HAVING COUNT(*) > 28)" },
    { name: 'Struggling (<10%)', condition: "id IN (SELECT user_id FROM user_progress GROUP BY user_id HAVING COUNT(*) < 6)" },
  ];

  return groups.map(group => {
    const query = `
      SELECT 
        COUNT(*) as student_count,
        SUM((SELECT COUNT(*) FROM user_progress WHERE user_id = u.id)) as tasks_completed,
        AVG((SELECT AVG(attempts) FROM user_progress WHERE user_id = u.id)) as avg_attempts
      FROM users u
      WHERE role = 'student' AND ${group.condition}
    `;

    const stats = db.prepare(query).get(...(group.params || [])) as {
      student_count: number;
      tasks_completed: number;
      avg_attempts: number | null;
    };

    if (stats.student_count === 0) {
      return {
        group_name: group.name,
        student_count: 0,
        avg_completion_rate: 0,
        avg_attempts: 0,
        avg_velocity: 0,
        avg_engagement: 0,
        tasks_completed: 0,
        total_students: 0,
      };
    }

    // Calculate engagement for this group
    const students = db.prepare(`
      SELECT id, created_at, tasks_completed
      FROM users
      WHERE role = 'student' AND ${group.condition}
    `).all(...(group.params || [])) as Array<{
      id: string;
      created_at: number;
      tasks_completed: number;
    }>;

    const rates = students.map(s => {
      const completionRate = Math.min((s.tasks_completed / TRAINING_TASKS.length) * 100, 100);
      const daysSinceCreated = (now - s.created_at) / dayMs;
      const weeksSinceCreated = daysSinceCreated / 7;
      const velocity = weeksSinceCreated > 0 ? s.tasks_completed / weeksSinceCreated : 0;
      return { completionRate, velocity };
    });

    return {
      group_name: group.name,
      student_count: stats.student_count,
      avg_completion_rate: Math.round((rates.reduce((sum, r) => sum + r.completionRate, 0) / stats.student_count) * 10) / 10,
      avg_attempts: Math.round((stats.avg_attempts || 0) * 10) / 10,
      avg_velocity: Math.round((rates.reduce((sum, r) => sum + r.velocity, 0) / stats.student_count) * 10) / 10,
      avg_engagement: Math.round((rates.reduce((sum, r) => sum + r.completionRate, 0) / stats.student_count)),
      tasks_completed: stats.tasks_completed,
      total_students: stats.student_count,
    };
  });
}

// ==================== Enhanced Academic Analytics ====================

// --- 1. Topic Performance Analysis ---

export interface TopicPerformanceEntry {
  topic: string;
  total_tasks: number;
  students_attempted: number;
  students_completed: number;
  avg_attempts: number;
  first_attempt_rate: number;
  completion_rate: number;
  trend: 'improving' | 'stable' | 'declining';
  avg_attempts_recent: number;
  avg_attempts_previous: number;
}

export function getTopicPerformanceAnalysis(filters?: TimeRangeFilters): TopicPerformanceEntry[] {
  const db = getDb();
  const categories = buildTaskSkillCategories();
  const now = Date.now();
  const recentCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const previousCutoff = now - 60 * 24 * 60 * 60 * 1000;

  return categories.map(cat => {
    const placeholders = cat.taskIds.map(() => '?').join(',');
    if (!cat.taskIds.length) {
      return { topic: cat.name, total_tasks: 0, students_attempted: 0, students_completed: 0, avg_attempts: 0, first_attempt_rate: 0, completion_rate: 0, trend: 'stable' as const, avg_attempts_recent: 0, avg_attempts_previous: 0 };
    }

    let baseDateCondition = '';
    const baseDateParams: any[] = [...cat.taskIds];
    if (filters?.start_date) {
      baseDateCondition += ' AND completed_at >= ?';
      baseDateParams.push(filters.start_date);
    }
    if (filters?.end_date) {
      baseDateCondition += ' AND completed_at <= ?';
      baseDateParams.push(filters.end_date);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as students_attempted,
        COUNT(*) as students_completed,
        ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
        ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
      FROM user_progress
      WHERE task_id IN (${placeholders})${baseDateCondition}
    `).get(...baseDateParams) as { students_attempted: number; students_completed: number; avg_attempts: number; first_attempt_rate: number };

    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };

    // Trend: recent vs previous
    const recent = db.prepare(`
      SELECT ROUND(AVG(attempts * 1.0), 2) as avg_val FROM user_progress
      WHERE task_id IN (${placeholders}) AND completed_at >= ?
    `).get(...cat.taskIds, recentCutoff) as { avg_val: number };

    const previous = db.prepare(`
      SELECT ROUND(AVG(attempts * 1.0), 2) as avg_val FROM user_progress
      WHERE task_id IN (${placeholders}) AND completed_at >= ? AND completed_at < ?
    `).get(...cat.taskIds, previousCutoff, recentCutoff) as { avg_val: number };

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (previous.avg_val && recent.avg_val < previous.avg_val * 0.9) trend = 'improving';
    else if (previous.avg_val && recent.avg_val > previous.avg_val * 1.1) trend = 'declining';

    return {
      topic: cat.name,
      total_tasks: cat.totalTasks,
      students_attempted: stats.students_attempted,
      students_completed: stats.students_completed,
      avg_attempts: stats.avg_attempts,
      first_attempt_rate: stats.first_attempt_rate,
      completion_rate: totalStudents.count > 0 ? Math.round((stats.students_attempted / totalStudents.count) * 1000) / 10 : 0,
      trend,
      avg_attempts_recent: recent.avg_val || 0,
      avg_attempts_previous: previous.avg_val || 0,
    };
  });
}

// --- 2. Predictive Grades ---

export interface PredictiveGradeEntry {
  user_id: string;
  name: string;
  email: string;
  current_score: number;
  predicted_final: number;
  grade_letter: string;
  confidence: number;
  trajectory: 'rising' | 'flat' | 'falling';
  weeks_of_data: number;
}

export function getPredictiveGrades(filters?: TimeRangeFilters): PredictiveGradeEntry[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let baseDateCondition = '';
  const baseDateParams: any[] = [];
  if (filters?.start_date) {
    baseDateCondition += ' AND completed_at >= ?';
    baseDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    baseDateCondition += ' AND completed_at <= ?';
    baseDateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.created_at,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'advanced-%' THEN 1 ELSE 0 END), 0) as advanced_completed,
      MIN(up.completed_at) as first_completion,
      MAX(up.completed_at) as last_completion
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'${baseDateCondition}
    GROUP BY u.id, u.name, u.email, u.created_at
    ORDER BY u.name
  `).all(...baseDateParams) as {
    id: string; name: string; email: string; created_at: number;
    tasks_completed: number; avg_attempts: number; advanced_completed: number;
    first_completion: number | null; last_completion: number | null;
  }[];

  const totalTasks = TRAINING_TASKS.length;

  return students.map(student => {
    const completionRate = (student.tasks_completed / totalTasks) * 100;
    const attemptEfficiency = Math.max(0, (1 - (student.avg_attempts / 6))) * 100;
    const difficultyBonus = Math.min((student.advanced_completed / 25) * 100, 100);

    const currentScore = Math.round(
      (completionRate * 0.6) + (attemptEfficiency * 0.25) + (difficultyBonus * 0.15)
    );

    // Trajectory: compare last 14d vs prior 14d
    const recentCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_progress
      WHERE user_id = ? AND completed_at >= ?
    `).get(student.id, now - 14 * dayMs) as { count: number };

    const previousCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_progress
      WHERE user_id = ? AND completed_at >= ? AND completed_at < ?
    `).get(student.id, now - 28 * dayMs, now - 14 * dayMs) as { count: number };

    let trajectory: 'rising' | 'flat' | 'falling' = 'flat';
    if (previousCount.count === 0) {
      trajectory = recentCount.count > 0 ? 'rising' : 'flat';
    } else if (recentCount.count > previousCount.count * 1.2) trajectory = 'rising';
    else if (recentCount.count < previousCount.count * 0.8) trajectory = 'falling';

    // Confidence: based on data volume
    const weeksOfData = student.first_completion && student.last_completion
      ? Math.max(1, Math.round((student.last_completion - student.first_completion) / (7 * dayMs)))
      : 0;
    const confidence = Math.min(student.tasks_completed / 20, 1.0);

    // Predicted final: current score adjusted by trajectory
    let predictedFinal = currentScore;
    if (trajectory === 'rising') predictedFinal = Math.min(100, Math.round(currentScore * 1.1));
    else if (trajectory === 'falling') predictedFinal = Math.max(0, Math.round(currentScore * 0.9));

    let gradeLetter = 'F';
    if (predictedFinal >= 90) gradeLetter = 'A';
    else if (predictedFinal >= 80) gradeLetter = 'B';
    else if (predictedFinal >= 70) gradeLetter = 'C';
    else if (predictedFinal >= 60) gradeLetter = 'D';

    return {
      user_id: student.id,
      name: student.name,
      email: student.email,
      current_score: currentScore,
      predicted_final: predictedFinal,
      grade_letter: gradeLetter,
      confidence: Math.round(confidence * 100) / 100,
      trajectory,
      weeks_of_data: weeksOfData,
    };
  });
}

// --- 3. Learning Path Effectiveness ---

export interface LearningPathEntry {
  user_id: string;
  name: string;
  path_type: 'sequential' | 'mixed' | 'random';
  sequentiality_score: number;
  tasks_completed: number;
  avg_attempts: number;
  completion_rate: number;
  avg_days_to_complete: number;
}

export function getLearningPathEffectiveness(filters?: TimeRangeFilters): LearningPathEntry[] {
  const db = getDb();
  const totalTasks = TRAINING_TASKS.length;

  // Build global task order from TRAINING_TASKS
  const taskOrderMap = new Map<string, number>();
  TRAINING_TASKS.forEach((task, index) => {
    taskOrderMap.set(task.id, index);
  });

  let baseDateCondition = '';
  const baseDateParams: any[] = [];
  if (filters?.start_date) {
    baseDateCondition += ' AND completed_at >= ?';
    baseDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    baseDateCondition += ' AND completed_at <= ?';
    baseDateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT u.id, u.name, u.tasks_completed, u.created_at
    FROM users u
    WHERE u.role = 'student' AND u.tasks_completed >= 3
    ORDER BY u.name
  `).all() as { id: string; name: string; tasks_completed: number; created_at: number }[];

  return students.map(student => {
    const progress = db.prepare(`
      SELECT task_id, completed_at FROM user_progress
      WHERE user_id = ?${baseDateCondition}
      ORDER BY completed_at ASC
    `).all(student.id, ...baseDateParams) as { task_id: string; completed_at: number }[];

    // Compute sequentiality score
    let adjacentPairs = 0;
    let totalPairs = 0;
    for (let i = 1; i < progress.length; i++) {
      const prevIdx = taskOrderMap.get(progress[i - 1].task_id);
      const currIdx = taskOrderMap.get(progress[i].task_id);
      if (prevIdx !== undefined && currIdx !== undefined) {
        totalPairs++;
        if (Math.abs(currIdx - prevIdx) <= 3) adjacentPairs++;
      }
    }
    const sequentialityScore = totalPairs > 0 ? adjacentPairs / totalPairs : 0;

    let pathType: 'sequential' | 'mixed' | 'random';
    if (sequentialityScore >= 0.7) pathType = 'sequential';
    else if (sequentialityScore >= 0.3) pathType = 'mixed';
    else pathType = 'random';

    const avgAttempts = progress.length > 0
      ? Math.round((db.prepare('SELECT ROUND(AVG(attempts * 1.0), 2) as avg FROM user_progress WHERE user_id = ?').get(student.id) as { avg: number }).avg * 100) / 100
      : 0;

    const daysSpan = progress.length >= 2
      ? Math.max(1, (progress[progress.length - 1].completed_at - progress[0].completed_at) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      user_id: student.id,
      name: student.name,
      path_type: pathType,
      sequentiality_score: Math.round(sequentialityScore * 100) / 100,
      tasks_completed: student.tasks_completed,
      avg_attempts: avgAttempts,
      completion_rate: Math.round((student.tasks_completed / totalTasks) * 1000) / 10,
      avg_days_to_complete: Math.round(daysSpan),
    };
  });
}

// --- 4. Bottleneck Analysis ---

export interface BottleneckEntry {
  task_id: string;
  title: string;
  difficulty: string;
  students_attempted: number;
  avg_attempts: number;
  high_attempt_students: number;
  drop_off_rate: number;
  subsequent_task_completion_rate: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export function getBottleneckAnalysis(filters?: TimeRangeFilters): BottleneckEntry[] {
  const db = getDb();

  let baseDateCondition = '';
  const baseDateParams: any[] = [];
  if (filters?.start_date) {
    baseDateCondition += ' AND completed_at >= ?';
    baseDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    baseDateCondition += ' AND completed_at <= ?';
    baseDateParams.push(filters.end_date);
  }

  const taskStats = db.prepare(`
    SELECT
      task_id,
      COUNT(DISTINCT user_id) as students_attempted,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      SUM(CASE WHEN attempts > 5 THEN 1 ELSE 0 END) as high_attempt_students
    FROM user_progress
    WHERE 1=1${baseDateCondition}
    GROUP BY task_id
    ORDER BY avg_attempts DESC
  `).all(...baseDateParams) as {
    task_id: string; students_attempted: number; avg_attempts: number; high_attempt_students: number;
  }[];

  // For drop-off: for each task, find how many completed prior tasks but not this one
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };

  // Group tasks by difficulty to determine "prior tasks"
  const difficultyOrder: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

  return taskStats.map(task => {
    const difficulty = task.task_id.startsWith('beginner-') ? 'beginner'
      : task.task_id.startsWith('intermediate-') ? 'intermediate' : 'advanced';
    const diffLevel = difficultyOrder[difficulty];

    // Students who completed at least one task of same or lower difficulty but not this one
    const priorPattern = difficulty === 'beginner' ? 'beginner-%'
      : difficulty === 'intermediate' ? '(beginner-% OR intermediate-%)'
      : '(beginner-% OR intermediate-% OR advanced-%)';

    const completedPrior = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_progress
      WHERE task_id LIKE ?${baseDateCondition}
    `).get(difficulty === 'beginner' ? 'beginner-%' : difficulty === 'intermediate' ? 'beginner-%' : 'beginner-%', ...baseDateParams) as { count: number };

    const dropOffRate = completedPrior.count > 0
      ? Math.round(((completedPrior.count - task.students_attempted) / completedPrior.count) * 1000) / 10
      : 0;

    // Subsequent task completion: % of students who completed this task and also completed at least one harder task
    const subsequentPattern = difficulty === 'beginner' ? '(intermediate-% OR advanced-%)'
      : difficulty === 'intermediate' ? 'advanced-%'
      : 'advanced-%';

    const completedSubsequent = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_progress up1
      JOIN user_progress up2 ON up1.user_id = up2.user_id
      WHERE up1.task_id = ? AND up2.task_id LIKE ?
    `).get(task.task_id, difficulty === 'beginner' ? 'intermediate-%' : difficulty === 'intermediate' ? 'advanced-%' : 'advanced-%') as { count: number };

    const subsequentRate = task.students_attempted > 0
      ? Math.round((completedSubsequent.count / task.students_attempted) * 1000) / 10
      : 0;

    // Severity
    let severity: 'critical' | 'high' | 'medium' | 'low';
    if (dropOffRate > 50 && task.avg_attempts > 4) severity = 'critical';
    else if (dropOffRate > 30 || task.avg_attempts > 3.5) severity = 'high';
    else if (dropOffRate > 15 || task.avg_attempts > 2.5) severity = 'medium';
    else severity = 'low';

    const title = task.task_id
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      task_id: task.task_id,
      title,
      difficulty,
      students_attempted: task.students_attempted,
      avg_attempts: task.avg_attempts,
      high_attempt_students: task.high_attempt_students,
      drop_off_rate: Math.max(0, dropOffRate),
      subsequent_task_completion_rate: subsequentRate,
      severity,
    };
  }).filter(t => t.severity !== 'low').slice(0, 20);
}

// --- 5. Peer Comparison Matrix ---

export interface PeerComparisonEntry {
  user_id: string;
  name: string;
  email: string;
  percentiles: {
    completion_rate: number;
    avg_attempts: number;
    velocity: number;
    consistency: number;
  };
  cohort_avg: {
    completion_rate: number;
    avg_attempts: number;
    velocity: number;
  };
  tasks_completed: number;
  avg_attempts: number;
  velocity: number;
}

export function getPeerComparisonMatrix(filters?: TimeRangeFilters): PeerComparisonEntry[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const totalTasks = TRAINING_TASKS.length;

  const students = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.created_at,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email, u.created_at
  `).all() as {
    id: string; name: string; email: string; created_at: number;
    tasks_completed: number; avg_attempts: number; last_active: number | null;
  }[];

  const studentMetrics = students.map(s => {
    const daysSinceCreated = Math.max(1, (now - s.created_at) / dayMs);
    const weeksSinceCreated = daysSinceCreated / 7;
    const velocity = Math.round((s.tasks_completed / weeksSinceCreated) * 10) / 10;
    const completionRate = Math.round((s.tasks_completed / totalTasks) * 1000) / 10;
    const daysSinceActive = s.last_active ? (now - s.last_active) / dayMs : 999;
    const consistency = Math.max(0, Math.round((1 - (daysSinceActive / daysSinceCreated)) * 100));

    return { ...s, velocity, completion_rate: completionRate, consistency };
  });

  const n = studentMetrics.length;
  if (n === 0) return [];

  const cohortAvg = {
    completion_rate: Math.round((studentMetrics.reduce((sum, s) => sum + s.completion_rate, 0) / n) * 10) / 10,
    avg_attempts: Math.round((studentMetrics.reduce((sum, s) => sum + s.avg_attempts, 0) / n) * 100) / 100,
    velocity: Math.round((studentMetrics.reduce((sum, s) => sum + s.velocity, 0) / n) * 10) / 10,
  };

  return studentMetrics.map(s => {
    const completionPercentile = Math.round(
      (studentMetrics.filter(m => m.completion_rate <= s.completion_rate).length / n) * 100
    );
    // For avg_attempts, lower is better, so invert
    const attemptsPercentile = Math.round(
      (studentMetrics.filter(m => m.avg_attempts >= s.avg_attempts).length / n) * 100
    );
    const velocityPercentile = Math.round(
      (studentMetrics.filter(m => m.velocity <= s.velocity).length / n) * 100
    );
    const consistencyPercentile = Math.round(
      (studentMetrics.filter(m => m.consistency <= s.consistency).length / n) * 100
    );

    return {
      user_id: s.id,
      name: s.name,
      email: s.email,
      percentiles: {
        completion_rate: completionPercentile,
        avg_attempts: attemptsPercentile,
        velocity: velocityPercentile,
        consistency: consistencyPercentile,
      },
      cohort_avg: cohortAvg,
      tasks_completed: s.tasks_completed,
      avg_attempts: s.avg_attempts,
      velocity: s.velocity,
    };
  });
}

// --- 6. Task Category Performance ---

export interface CategoryPerformanceEntry {
  category: string;
  label: string;
  total_tasks: number;
  students_attempted: number;
  students_completed_all: number;
  avg_attempts: number;
  completion_rate: number;
}

export function getTaskCategoryPerformance(filters?: TimeRangeFilters): CategoryPerformanceEntry[] {
  const db = getDb();
  const totalTasks = TRAINING_TASKS.length;

  const categories = [
    { key: 'company', label: 'Компания', prefixes: ['beginner-', 'intermediate-', 'advanced-'], count: 8 + 15 + 25 },
    { key: 'analytics', label: 'Аналитика', prefixes: ['analytics-b-', 'analytics-i-', 'analytics-a-'], count: 15 },
    { key: 'shop', label: 'Магазин', prefixes: ['shop-b-', 'shop-i-', 'shop-a-'], count: 19 },
    { key: 'exam', label: 'Экзамен', prefixes: ['exam-b-', 'exam-i-', 'exam-a-'], count: 15 },
  ];

  // Filter out categories that have no tasks in TRAINING_TASKS
  const activeCategories = categories.filter(cat => {
    return TRAINING_TASKS.some(t => cat.prefixes.some(p => t.id.startsWith(p)));
  });

  if (activeCategories.length === 0) return [];

  return activeCategories.map(cat => {
    const taskIds = TRAINING_TASKS.filter(t => cat.prefixes.some(p => t.id.startsWith(p))).map(t => t.id);
    if (!taskIds.length) {
      return { category: cat.key, label: cat.label, total_tasks: 0, students_attempted: 0, students_completed_all: 0, avg_attempts: 0, completion_rate: 0 };
    }

    const placeholders = taskIds.map(() => '?').join(',');

    let baseDateCondition = '';
    const baseDateParams: any[] = [...taskIds];
    if (filters?.start_date) {
      baseDateCondition += ' AND completed_at >= ?';
      baseDateParams.push(filters.start_date);
    }
    if (filters?.end_date) {
      baseDateCondition += ' AND completed_at <= ?';
      baseDateParams.push(filters.end_date);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as students_attempted,
        ROUND(AVG(attempts * 1.0), 2) as avg_attempts
      FROM user_progress
      WHERE task_id IN (${placeholders})${baseDateCondition}
    `).get(...baseDateParams) as { students_attempted: number; avg_attempts: number };

    const completedAll = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id FROM user_progress
        WHERE task_id IN (${placeholders})${baseDateCondition}
        GROUP BY user_id
        HAVING COUNT(DISTINCT task_id) >= ?
      )
    `).get(...baseDateParams, taskIds.length) as { count: number };

    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };

    return {
      category: cat.key,
      label: cat.label,
      total_tasks: taskIds.length,
      students_attempted: stats.students_attempted,
      students_completed_all: completedAll.count,
      avg_attempts: stats.avg_attempts,
      completion_rate: totalStudents.count > 0 ? Math.round((stats.students_attempted / totalStudents.count) * 1000) / 10 : 0,
    };
  });
}

// --- 7. Session Analysis ---

export interface SessionEntry {
  user_id: string;
  name: string;
  email: string;
  total_sessions: number;
  avg_tasks_per_session: number;
  avg_session_duration_minutes: number;
  longest_session_tasks: number;
  preferred_time_of_day: string;
  weekend_session_ratio: number;
}

export function getSessionAnalysis(): SessionEntry[] {
  const db = getDb();
  const sessionGapMs = 30 * 60 * 1000; // 30 minute gap

  const students = db.prepare(`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'student' AND u.tasks_completed >= 2
    ORDER BY u.name
  `).all() as { id: string; name: string; email: string }[];

  return students.map(student => {
    const progress = db.prepare(`
      SELECT completed_at FROM user_progress
      WHERE user_id = ?
      ORDER BY completed_at ASC
    `).all(student.id) as { completed_at: number }[];

    if (progress.length < 2) {
      return { user_id: student.id, name: student.name, email: student.email, total_sessions: 0, avg_tasks_per_session: 0, avg_session_duration_minutes: 0, longest_session_tasks: 0, preferred_time_of_day: 'N/A', weekend_session_ratio: 0 };
    }

    // Group into sessions
    const sessions: { tasks: number; start: number; end: number }[] = [];
    let currentSession = { tasks: 1, start: progress[0].completed_at, end: progress[0].completed_at };

    for (let i = 1; i < progress.length; i++) {
      if (progress[i].completed_at - currentSession.end > sessionGapMs) {
        sessions.push(currentSession);
        currentSession = { tasks: 1, start: progress[i].completed_at, end: progress[i].completed_at };
      } else {
        currentSession.tasks++;
        currentSession.end = progress[i].completed_at;
      }
    }
    sessions.push(currentSession);

    const totalSessions = sessions.length;
    const avgTasksPerSession = Math.round((progress.length / totalSessions) * 10) / 10;
    const avgDuration = Math.round(
      sessions.reduce((sum, s) => sum + (s.end - s.start) / 60000, 0) / totalSessions
    );
    const longestSessionTasks = Math.max(...sessions.map(s => s.tasks));

    // Time of day analysis
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let weekendSessions = 0;

    for (const session of sessions) {
      const date = new Date(session.start);
      const hour = date.getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
      else if (hour >= 18 && hour < 23) timeSlots.evening++;
      else timeSlots.night++;

      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendSessions++;
    }

    const preferredTime = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Translate time of day
    const timeLabels: Record<string, string> = { morning: 'Утро', afternoon: 'День', evening: 'Вечер', night: 'Ночь' };

    return {
      user_id: student.id,
      name: student.name,
      email: student.email,
      total_sessions: totalSessions,
      avg_tasks_per_session: avgTasksPerSession,
      avg_session_duration_minutes: avgDuration,
      longest_session_tasks: longestSessionTasks,
      preferred_time_of_day: timeLabels[preferredTime] || preferredTime,
      weekend_session_ratio: Math.round((weekendSessions / totalSessions) * 100) / 100,
    };
  });
}

// --- 8. Hint Impact Analysis (heuristic-based) ---

export interface HintImpactEntry {
  task_id: string;
  title: string;
  difficulty: string;
  avg_attempts: number;
  hint_likely_rate: number;
  struggle_score: number;
  completion_rate: number;
  is_bottleneck: boolean;
}

export function getHintImpactAnalysis(filters?: TimeRangeFilters): HintImpactEntry[] {
  const db = getDb();

  // Check if hint_usage table exists
  const tables = db.pragma("table_list") as { name: string }[];
  const hasHintTable = tables.some(t => t.name === 'hint_usage');

  let baseDateCondition = '';
  const baseDateParams: any[] = [];
  if (filters?.start_date) {
    baseDateCondition += ' AND completed_at >= ?';
    baseDateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    baseDateCondition += ' AND completed_at <= ?';
    baseDateParams.push(filters.end_date);
  }

  const taskStats = db.prepare(`
    SELECT
      task_id,
      COUNT(DISTINCT user_id) as students_attempted,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      MAX(attempts) as max_attempts,
      SUM(CASE WHEN attempts > 3 THEN 1 ELSE 0 END) as high_attempt_count
    FROM user_progress
    WHERE 1=1${baseDateCondition}
    GROUP BY task_id
    ORDER BY avg_attempts DESC
  `).all(...baseDateParams) as {
    task_id: string; students_attempted: number; avg_attempts: number;
    max_attempts: number; high_attempt_count: number;
  }[];

  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };

  return taskStats.map(task => {
    const difficulty = task.task_id.startsWith('beginner-') ? 'beginner'
      : task.task_id.startsWith('intermediate-') ? 'intermediate' : 'advanced';

    // Heuristic: tasks with avg_attempts > 3 are "hint-needing"
    const hintLikelyRate = task.students_attempted > 0
      ? Math.round((task.high_attempt_count / task.students_attempted) * 1000) / 10
      : 0;

    // Struggle score: weighted combination
    const struggleScore = Math.min(100, Math.round(
      (task.avg_attempts / 6) * 60 + (hintLikelyRate / 100) * 40
    ));

    const isBottleneck = task.avg_attempts > 3.5 || hintLikelyRate > 40;

    const title = task.task_id
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      task_id: task.task_id,
      title,
      difficulty,
      avg_attempts: task.avg_attempts,
      hint_likely_rate: hintLikelyRate,
      struggle_score: struggleScore,
      completion_rate: totalStudents.count > 0 ? Math.round((task.students_attempted / totalStudents.count) * 1000) / 10 : 0,
      is_bottleneck: isBottleneck,
    };
  }).filter(t => t.struggle_score > 20).slice(0, 20);
}

// ==================== End Enhanced Academic Analytics ====================

// ==================== Hint Usage Tracking ====================

export function saveHintUsage(userId: string, taskId: string): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    'INSERT INTO hint_usage (user_id, task_id, revealed_at) VALUES (?, ?, ?)'
  ).run(userId, taskId, now);
}

export function getHintUsageByTask(taskId: string): { count: number; unique_users: number } {
  const db = getDb();
  const row = db.prepare(`
    SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
    FROM hint_usage WHERE task_id = ?
  `).get(taskId) as { count: number; unique_users: number };
  return row;
}

export function getHintUsageByStudent(userId: string): { task_id: string; revealed_at: number }[] {
  const db = getDb();
  return db.prepare(
    'SELECT task_id, revealed_at FROM hint_usage WHERE user_id = ? ORDER BY revealed_at ASC'
  ).all(userId) as { task_id: string; revealed_at: number }[];
}

// ==================== End Hint Usage Tracking ====================

// ==================== Expanded Analytics ====================

// --- Deadline Compliance ---

export interface DeadlineComplianceEntry {
  deadline_id: string;
  title: string;
  due_at: number;
  targeted_students: number;
  completed_on_time: number;
  completed_late: number;
  missed: number;
  compliance_rate: number;
  avg_days_overdue: number;
}

export interface DeadlineComplianceReport {
  deadlines: DeadlineComplianceEntry[];
  overall_stats: {
    total_deadlines: number;
    overall_compliance_rate: number;
    total_on_time: number;
    total_late: number;
    total_missed: number;
    avg_days_overdue: number;
  };
  overdue_students: {
    user_id: string;
    name: string;
    email: string;
    deadline_title: string;
    due_at: number;
    days_overdue: number;
    completed: boolean;
  }[];
}

export function getDeadlineCompliance(filters?: TimeRangeFilters): DeadlineComplianceReport {
  const db = getDb();
  const now = Date.now();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND d.due_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND d.due_at <= ?';
    dateParams.push(filters.end_date);
  }

  const deadlines = db.prepare(`
    SELECT d.id as deadline_id, d.title, d.due_at, d.task_id, d.target_type
    FROM deadlines d
    WHERE 1=1${dateCondition}
    ORDER BY d.due_at DESC
  `).all(...dateParams) as Array<{
    deadline_id: string;
    title: string;
    due_at: number;
    task_id: string | null;
    target_type: string;
  }>;

  const deadlineEntries: DeadlineComplianceEntry[] = [];
  const overdueStudents: DeadlineComplianceReport['overdue_students'] = [];

  let totalOnTime = 0;
  let totalLate = 0;
  let totalMissed = 0;
  let totalOverdueDays = 0;
  let overdueCount = 0;

  for (const deadline of deadlines) {
    const targetCondition = deadline.target_type === 'all_students'
      ? "WHERE u.role = 'student'"
      : deadline.target_type === 'task' && deadline.task_id
        ? `INNER JOIN user_progress up2 ON u.id = up2.user_id WHERE up2.task_id = '${deadline.task_id}'`
        : "WHERE u.role = 'student'";

    const targetedStudents = db.prepare(`
      SELECT u.id, u.name, u.email
      FROM users u ${targetCondition}
    `).all() as Array<{ id: string; name: string; email: string }>;

    let completedOnTime = 0;
    let completedLate = 0;
    let totalOverdue = 0;

    for (const student of targetedStudents) {
      const completion = db.prepare(`
        SELECT completed_at FROM user_progress
        WHERE user_id = ? AND task_id = ?
      `).get(student.id, deadline.task_id || '') as { completed_at: number } | undefined;

      if (completion) {
        if (completion.completed_at <= deadline.due_at) {
          completedOnTime++;
        } else {
          completedLate++;
          const daysOverdue = Math.round((completion.completed_at - deadline.due_at) / (24 * 60 * 60 * 1000));
          totalOverdue += daysOverdue;
          overdueStudents.push({
            user_id: student.id,
            name: student.name,
            email: student.email,
            deadline_title: deadline.title,
            due_at: deadline.due_at,
            days_overdue: daysOverdue,
            completed: true,
          });
        }
      } else if (deadline.due_at < now) {
        totalOverdue++;
        const daysOverdue = Math.round((now - deadline.due_at) / (24 * 60 * 60 * 1000));
        overdueStudents.push({
          user_id: student.id,
          name: student.name,
          email: student.email,
          deadline_title: deadline.title,
          due_at: deadline.due_at,
          days_overdue: daysOverdue,
          completed: false,
        });
      }
    }

    const total = targetedStudents.length;
    const complianceRate = total > 0 ? Math.round((completedOnTime / total) * 1000) / 10 : 0;
    const avgOverdue = completedLate > 0 ? Math.round((totalOverdue / completedLate) * 10) / 10 : 0;

    deadlineEntries.push({
      deadline_id: deadline.deadline_id,
      title: deadline.title,
      due_at: deadline.due_at,
      targeted_students: total,
      completed_on_time: completedOnTime,
      completed_late: completedLate,
      missed: totalMissed,
      compliance_rate: complianceRate,
      avg_days_overdue: avgOverdue,
    });

    totalOnTime += completedOnTime;
    totalLate += completedLate;
    totalMissed += totalOverdue;
    if (completedLate > 0) {
      totalOverdueDays += totalOverdue;
      overdueCount += completedLate;
    }
  }

  const totalTargeted = totalOnTime + totalLate + totalMissed;
  const overallRate = totalTargeted > 0 ? Math.round((totalOnTime / totalTargeted) * 1000) / 10 : 0;

  return {
    deadlines: deadlineEntries,
    overall_stats: {
      total_deadlines: deadlines.length,
      overall_compliance_rate: overallRate,
      total_on_time: totalOnTime,
      total_late: totalLate,
      total_missed: totalMissed,
      avg_days_overdue: overdueCount > 0 ? Math.round((totalOverdueDays / overdueCount) * 10) / 10 : 0,
    },
    overdue_students: overdueStudents.sort((a, b) => b.days_overdue - a.days_overdue).slice(0, 50),
  };
}

// --- Notification Delivery Analytics ---

export interface NotificationDeliveryStats {
  by_channel: Array<{
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    success_rate: number;
  }>;
  email_queue: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    retrying: number;
  };
  recent_failures: Array<{
    channel: string;
    user_id: string;
    user_name: string;
    error: string;
    sent_at: number;
  }>;
  delivery_trend: Array<{
    date: string;
    sent: number;
    failed: number;
  }>;
  overall_stats: {
    total_sent: number;
    total_failed: number;
    overall_success_rate: number;
  };
}

export function getNotificationDeliveryStats(filters?: TimeRangeFilters): NotificationDeliveryStats {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND sent_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND sent_at <= ?';
    dateParams.push(filters.end_date);
  }

  // Reminder log by channel
  const channels = ['in_app', 'email', 'push'];
  const byChannel = channels.map(channel => {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM reminder_schedule
      WHERE channel = ?${dateCondition}
    `).get(channel, ...dateParams) as { total: number; sent: number; failed: number; pending: number };

    const delivered = stats.sent || 0;
    const failed = stats.failed || 0;
    const total = delivered + failed;
    return {
      channel,
      sent: stats.sent || 0,
      delivered,
      failed,
      pending: stats.pending || 0,
      success_rate: total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0,
    };
  });

  // Email queue stats
  const emailQueue = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'retrying' THEN 1 ELSE 0 END) as retrying
    FROM email_queue
  `).get() as { total: number; sent: number; pending: number; failed: number; retrying: number };

  // Recent failures
  const recentFailures = db.prepare(`
    SELECT rl.channel, rl.user_id, u.name as user_name, rl.error, rl.sent_at
    FROM reminder_log rl
    JOIN users u ON rl.user_id = u.id
    WHERE rl.status = 'failed'${dateCondition}
    ORDER BY rl.sent_at DESC
    LIMIT 20
  `).all(...dateParams) as Array<{
    channel: string;
    user_id: string;
    user_name: string;
    error: string;
    sent_at: number;
  }>;

  // Delivery trend (last 30 days)
  const trendRows = db.prepare(`
    SELECT
      date(sent_at / 1000, 'unixepoch') as date,
      COUNT(*) as sent,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM reminder_schedule
    WHERE sent_at IS NOT NULL${dateCondition}
    GROUP BY date
    ORDER BY date
    LIMIT 30
  `).all(...dateParams) as Array<{ date: string; sent: number; failed: number }>;

  // Fill gaps
  const trendMap = new Map(trendRows.map(r => [r.date, r]));
  const deliveryTrend: NotificationDeliveryStats['delivery_trend'] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const existing = trendMap.get(dateStr);
    deliveryTrend.push({
      date: dateStr,
      sent: existing?.sent || 0,
      failed: existing?.failed || 0,
    });
  }

  const totalSent = byChannel.reduce((s, c) => s + c.delivered, 0);
  const totalFailed = byChannel.reduce((s, c) => s + c.failed, 0);
  const overallTotal = totalSent + totalFailed;

  return {
    by_channel: byChannel,
    email_queue: {
      total: emailQueue.total || 0,
      sent: emailQueue.sent || 0,
      pending: emailQueue.pending || 0,
      failed: emailQueue.failed || 0,
      retrying: emailQueue.retrying || 0,
    },
    recent_failures: recentFailures,
    delivery_trend: deliveryTrend,
    overall_stats: {
      total_sent: totalSent,
      total_failed: totalFailed,
      overall_success_rate: overallTotal > 0 ? Math.round((totalSent / overallTotal) * 1000) / 10 : 0,
    },
  };
}

// --- Streak Analytics ---

export interface StreakAnalyticsReport {
  distribution: Array<{
    range: string;
    min: number;
    max: number;
    student_count: number;
  }>;
  top_streaks: Array<{
    user_id: string;
    name: string;
    email: string;
    streak_current: number;
    streak_longest: number;
    tasks_completed: number;
  }>;
  streak_completion_correlation: Array<{
    streak_bucket: string;
    avg_tasks_completed: number;
    avg_completion_rate: number;
    student_count: number;
  }>;
  summary: {
    avg_current_streak: number;
    avg_longest_streak: number;
    max_streak: number;
    students_with_streak: number;
    total_students: number;
  };
}

export function getStreakAnalytics(filters?: TimeRangeFilters): StreakAnalyticsReport {
  const db = getDb();

  const students = db.prepare(`
    SELECT u.id, u.name, u.email, u.streak_current, u.streak_longest,
           COUNT(up.task_id) as tasks_completed
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email, u.streak_current, u.streak_longest
  `).all() as Array<{
    id: string;
    name: string;
    email: string;
    streak_current: number;
    streak_longest: number;
    tasks_completed: number;
  }>;

  const totalTasks = TRAINING_TASKS.length;

  // Distribution buckets
  const buckets = [
    { range: '0', min: 0, max: 0 },
    { range: '1-3', min: 1, max: 3 },
    { range: '4-7', min: 4, max: 7 },
    { range: '8-14', min: 8, max: 14 },
    { range: '15-30', min: 15, max: 30 },
    { range: '31+', min: 31, max: 999 },
  ];

  const distribution = buckets.map(b => ({
    ...b,
    student_count: students.filter(s => s.streak_current >= b.min && s.streak_current <= b.max).length,
  }));

  // Top streaks
  const topStreaks = [...students]
    .sort((a, b) => b.streak_longest - a.streak_longest)
    .slice(0, 10)
    .map(s => ({
      user_id: s.id,
      name: s.name,
      email: s.email,
      streak_current: s.streak_current,
      streak_longest: s.streak_longest,
      tasks_completed: s.tasks_completed,
    }));

  // Correlation: streak bucket vs completion rate
  const streakBuckets = [
    { label: '0', min: 0, max: 0 },
    { label: '1-7', min: 1, max: 7 },
    { label: '8-14', min: 8, max: 14 },
    { label: '15+', min: 15, max: 999 },
  ];

  const correlation = streakBuckets.map(b => {
    const group = students.filter(s => s.streak_current >= b.min && s.streak_current <= b.max);
    const count = group.length;
    const avgTasks = count > 0 ? Math.round(group.reduce((s, st) => s + st.tasks_completed, 0) / count * 10) / 10 : 0;
    const avgRate = count > 0 ? Math.round(group.reduce((s, st) => s + (st.tasks_completed / totalTasks) * 100, 0) / count * 10) / 10 : 0;
    return {
      streak_bucket: b.label,
      avg_tasks_completed: avgTasks,
      avg_completion_rate: avgRate,
      student_count: count,
    };
  });

  const withStreak = students.filter(s => s.streak_current > 0);
  const maxStreak = students.length > 0 ? Math.max(...students.map(s => s.streak_longest)) : 0;

  return {
    distribution,
    top_streaks: topStreaks,
    streak_completion_correlation: correlation,
    summary: {
      avg_current_streak: students.length > 0 ? Math.round(students.reduce((s, st) => s + st.streak_current, 0) / students.length * 10) / 10 : 0,
      avg_longest_streak: students.length > 0 ? Math.round(students.reduce((s, st) => s + st.streak_longest, 0) / students.length * 10) / 10 : 0,
      max_streak: maxStreak,
      students_with_streak: withStreak.length,
      total_students: students.length,
    },
  };
}

// --- Onboarding Funnel ---

export interface OnboardingFunnelReport {
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
    drop_off_rate: number;
  }>;
  avg_time_hours: {
    registration_to_first_attempt: number;
    first_attempt_to_first_completion: number;
    first_completion_to_five: number;
  };
  weekly_trend: Array<{
    week: string;
    registered: number;
    first_completed: number;
    five_completed: number;
  }>;
  summary: {
    total_registered: number;
    onboarded_rate: number;
    avg_time_to_first_completion_hours: number;
  };
}

export function getOnboardingFunnel(filters?: TimeRangeFilters): OnboardingFunnelReport {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND u.created_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND u.created_at <= ?';
    dateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT u.id, u.created_at,
           (SELECT MIN(completed_at) FROM user_progress WHERE user_id = u.id) as first_completion,
           (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id) as total_completed
    FROM users u
    WHERE u.role = 'student'${dateCondition}
  `).all(...dateParams) as Array<{
    id: string;
    created_at: number;
    first_completion: number | null;
    total_completed: number;
  }>;

  const totalRegistered = students.length;
  const firstAttempted = students.filter(s => s.first_completion !== null).length;
  const firstCompleted = firstAttempted; // first_completion means they completed at least one
  const fiveCompleted = students.filter(s => s.total_completed >= 5).length;

  const funnel = [
    { stage: 'registered', count: totalRegistered, percentage: 100, drop_off_rate: 0 },
    {
      stage: 'first_task_completed',
      count: firstCompleted,
      percentage: totalRegistered > 0 ? Math.round((firstCompleted / totalRegistered) * 1000) / 10 : 0,
      drop_off_rate: totalRegistered > 0 ? Math.round(((totalRegistered - firstCompleted) / totalRegistered) * 1000) / 10 : 0,
    },
    {
      stage: 'five_tasks_completed',
      count: fiveCompleted,
      percentage: totalRegistered > 0 ? Math.round((fiveCompleted / totalRegistered) * 1000) / 10 : 0,
      drop_off_rate: firstCompleted > 0 ? Math.round(((firstCompleted - fiveCompleted) / firstCompleted) * 1000) / 10 : 0,
    },
  ];

  // Average time calculations
  const withCompletion = students.filter(s => s.first_completion !== null);
  const avgTimeToFirst = withCompletion.length > 0
    ? Math.round(withCompletion.reduce((s, st) => s + (st.first_completion! - st.created_at) / (60 * 60 * 1000), 0) / withCompletion.length * 10) / 10
    : 0;

  const withFive = students.filter(s => s.total_completed >= 5 && s.first_completion !== null);
  const avgTimeToFive = withFive.length > 0
    ? Math.round(withFive.reduce((s, st) => s + (st.first_completion! - st.created_at) / (60 * 60 * 1000), 0) / withFive.length * 10) / 10
    : 0;

  // Weekly trend
  const weekMap = new Map<string, { registered: number; first_completed: number; five_completed: number }>();
  for (const student of students) {
    const weekStart = new Date(student.created_at);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const week = weekMap.get(weekKey) ?? { registered: 0, first_completed: 0, five_completed: 0 };
    week.registered++;
    if (student.first_completion !== null) week.first_completed++;
    if (student.total_completed >= 5) week.five_completed++;
    weekMap.set(weekKey, week);
  }

  const weeklyTrend = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, data]) => ({ week, ...data }));

  return {
    funnel,
    avg_time_hours: {
      registration_to_first_attempt: avgTimeToFirst,
      first_attempt_to_first_completion: 0, // Not tracked separately
      first_completion_to_five: avgTimeToFive,
    },
    weekly_trend: weeklyTrend,
    summary: {
      total_registered: totalRegistered,
      onboarded_rate: funnel[2].percentage,
      avg_time_to_first_completion_hours: avgTimeToFirst,
    },
  };
}

// --- Re-engagement Analytics ---

export interface ReEngagementReport {
  re_engaged_students: Array<{
    user_id: string;
    name: string;
    email: string;
    last_gap_days: number;
    re_engaged_at: number;
    tasks_before_gap: number;
    tasks_after_gap: number;
  }>;
  re_engagement_rate: number;
  avg_gap_days: number;
  total_re_engaged: number;
  total_students: number;
  bring_back_tasks: Array<{
    task_id: string;
    task_title: string;
    re_engagement_count: number;
  }>;
}

export function getReEngagementMetrics(filters?: TimeRangeFilters): ReEngagementReport {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND up.completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND up.completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  const students = db.prepare(`
    SELECT u.id, u.name, u.email,
           up.completed_at,
           up.task_id
    FROM users u
    JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'${dateCondition}
    ORDER BY u.id, up.completed_at ASC
  `).all(...dateParams) as Array<{
    id: string;
    name: string;
    email: string;
    completed_at: number;
    task_id: string;
  }>;

  const studentMap = new Map<string, Array<{ completed_at: number; task_id: string }>>();
  for (const row of students) {
    const existing = studentMap.get(row.id);
    if (existing) {
      existing.push({ completed_at: row.completed_at, task_id: row.task_id });
    } else {
      const newArr = [{ completed_at: row.completed_at, task_id: row.task_id }];
      studentMap.set(row.id, newArr);
    }
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const GAP_THRESHOLD = 7 * dayMs; // 7 days gap

  const reEngaged: ReEngagementReport['re_engaged_students'] = [];
  const bringBackTaskCount = new Map<string, number>();

  for (const [userId, completions] of studentMap.entries()) {
    if (completions.length < 2) continue;
    const student = students.find(s => s.id === userId);
    if (!student) continue;
    let maxGap = 0;
    let reEngagedAt = 0;
    let tasksBeforeGap = 0;
    let tasksAfterGap = 0;
    let reEngagedTaskId = '';

    for (let i = 1; i < completions.length; i++) {
      const gap = completions[i].completed_at - completions[i - 1].completed_at;
      if (gap >= GAP_THRESHOLD && gap > maxGap) {
        maxGap = gap;
        reEngagedAt = completions[i].completed_at;
        tasksBeforeGap = i;
        tasksAfterGap = completions.length - i;
        reEngagedTaskId = completions[i].task_id;
      }
    }

    if (maxGap > 0) {
      reEngaged.push({
        user_id: userId,
        name: student.name,
        email: student.email,
        last_gap_days: Math.round(maxGap / dayMs),
        re_engaged_at: reEngagedAt,
        tasks_before_gap: tasksBeforeGap,
        tasks_after_gap: tasksAfterGap,
      });
      bringBackTaskCount.set(reEngagedTaskId, (bringBackTaskCount.get(reEngagedTaskId) || 0) + 1);
    }
  }

  const totalStudents = studentMap.size;
  const avgGap = reEngaged.length > 0
    ? Math.round(reEngaged.reduce((s, r) => s + r.last_gap_days, 0) / reEngaged.length * 10) / 10
    : 0;

  const bringBackTasks = [...bringBackTaskCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([taskId, count]) => ({
      task_id: taskId,
      task_title: taskId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      re_engagement_count: count,
    }));

  return {
    re_engaged_students: reEngaged.sort((a, b) => b.re_engaged_at - a.re_engaged_at).slice(0, 50),
    re_engagement_rate: totalStudents > 0 ? Math.round((reEngaged.length / totalStudents) * 1000) / 10 : 0,
    avg_gap_days: avgGap,
    total_re_engaged: reEngaged.length,
    total_students: totalStudents,
    bring_back_tasks: bringBackTasks,
  };
}

// --- Task Difficulty Calibration ---

export interface DifficultyCalibrationEntry {
  task_id: string;
  task_title: string;
  intended_difficulty: string;
  completions: number;
  avg_attempts: number;
  first_attempt_rate: number;
  failure_rate: number;
  actual_difficulty_score: number;
  recommended_difficulty: string;
  is_misclassified: boolean;
}

export interface DifficultyCalibrationReport {
  tasks: DifficultyCalibrationEntry[];
  misclassified_count: number;
  total_tasks: number;
  misclassified_rate: number;
}

export function getDifficultyCalibration(): DifficultyCalibrationReport {
  const db = getDb();

  const tasks = db.prepare(`
    SELECT task_id,
           COUNT(*) as completions,
           ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
           ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate,
           ROUND(100.0 * SUM(CASE WHEN attempts > 3 THEN 1 ELSE 0 END) / COUNT(*), 1) as failure_rate
    FROM user_progress
    GROUP BY task_id
  `).all() as Array<{
    task_id: string;
    completions: number;
    avg_attempts: number;
    first_attempt_rate: number;
    failure_rate: number;
  }>;

  const taskEntries: DifficultyCalibrationEntry[] = [];
  let misclassifiedCount = 0;

  for (const task of tasks) {
    const intendedDifficulty = task.task_id.startsWith('beginner-') ? 'beginner'
      : task.task_id.startsWith('intermediate-') ? 'intermediate' : 'advanced';

    // Actual difficulty score (0-100): higher = harder
    // Based on avg attempts (weight 40%), failure rate (weight 35%), first attempt rate (weight 25%)
    const attemptScore = Math.min((task.avg_attempts / 5) * 100, 100);
    const failureScore = task.failure_rate;
    const firstAttemptScore = 100 - task.first_attempt_rate;
    const actualDifficultyScore = Math.round(attemptScore * 0.4 + failureScore * 0.35 + firstAttemptScore * 0.25);

    // Determine recommended difficulty
    let recommendedDifficulty: string;
    if (actualDifficultyScore < 30) recommendedDifficulty = 'beginner';
    else if (actualDifficultyScore < 60) recommendedDifficulty = 'intermediate';
    else recommendedDifficulty = 'advanced';

    const isMisclassified = recommendedDifficulty !== intendedDifficulty && task.completions >= 5;
    if (isMisclassified) misclassifiedCount++;

    taskEntries.push({
      task_id: task.task_id,
      task_title: task.task_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      intended_difficulty: intendedDifficulty,
      completions: task.completions,
      avg_attempts: task.avg_attempts,
      first_attempt_rate: task.first_attempt_rate,
      failure_rate: task.failure_rate,
      actual_difficulty_score: actualDifficultyScore,
      recommended_difficulty: recommendedDifficulty,
      is_misclassified: isMisclassified,
    });
  }

  return {
    tasks: taskEntries.sort((a, b) => b.actual_difficulty_score - a.actual_difficulty_score),
    misclassified_count: misclassifiedCount,
    total_tasks: taskEntries.length,
    misclassified_rate: taskEntries.length > 0 ? Math.round((misclassifiedCount / taskEntries.length) * 1000) / 10 : 0,
  };
}

// --- Push Subscription Stats ---

export interface PushSubscriptionReport {
  total_students: number;
  with_push: number;
  without_push: number;
  coverage_rate: number;
  active_subscriptions: number;
  stale_subscriptions: number;
  subscriptions: Array<{
    user_id: string;
    user_name: string;
    endpoint: string;
    created_at: number;
    last_used: number | null;
    is_active: boolean;
  }>;
}

export function getPushSubscriptionStats(): PushSubscriptionReport {
  const db = getDb();

  const totalStudents = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number };

  const studentsWithPush = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM push_subscriptions
  `).get() as { count: number };

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const activeSubscriptions = db.prepare(`
    SELECT COUNT(*) as count FROM push_subscriptions
    WHERE last_used IS NULL OR last_used >= ?
  `).get(thirtyDaysAgo) as { count: number };

  const staleSubscriptions = db.prepare(`
    SELECT COUNT(*) as count FROM push_subscriptions
    WHERE last_used IS NOT NULL AND last_used < ?
  `).get(thirtyDaysAgo) as { count: number };

  const subscriptions = db.prepare(`
    SELECT ps.user_id, u.name as user_name, ps.endpoint, ps.created_at, ps.last_used,
           CASE WHEN ps.last_used IS NULL OR ps.last_used >= ? THEN 1 ELSE 0 END as is_active
    FROM push_subscriptions ps
    JOIN users u ON ps.user_id = u.id
    ORDER BY ps.created_at DESC
    LIMIT 50
  `).all(thirtyDaysAgo) as Array<{
    user_id: string;
    user_name: string;
    endpoint: string;
    created_at: number;
    last_used: number | null;
    is_active: number;
  }>;

  const withPush = studentsWithPush.count;
  const total = totalStudents.count;

  return {
    total_students: total,
    with_push: withPush,
    without_push: total - withPush,
    coverage_rate: total > 0 ? Math.round((withPush / total) * 1000) / 10 : 0,
    active_subscriptions: activeSubscriptions.count,
    stale_subscriptions: staleSubscriptions.count,
    subscriptions: subscriptions.map(s => ({
      user_id: s.user_id,
      user_name: s.user_name,
      endpoint: s.endpoint,
      created_at: s.created_at,
      last_used: s.last_used,
      is_active: s.is_active === 1,
    })),
  };
}

// --- Registration Trends ---

export interface RegistrationTrendEntry {
  date: string;
  count: number;
  cumulative: number;
}

export interface RegistrationTrendReport {
  daily: RegistrationTrendEntry[];
  weekly: Array<{ week: string; count: number }>;
  summary: {
    new_this_week: number;
    new_this_month: number;
    total: number;
    weekly_growth_rate: number;
  };
}

export function getRegistrationTrends(filters?: TimeRangeFilters): RegistrationTrendReport {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND created_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND created_at <= ?';
    dateParams.push(filters.end_date);
  }

  const dailyRows = db.prepare(`
    SELECT date(created_at / 1000, 'unixepoch') as date, COUNT(*) as count
    FROM users
    WHERE role = 'student'${dateCondition}
    GROUP BY date
    ORDER BY date
  `).all(...dateParams) as Array<{ date: string; count: number }>;

  // Fill gaps for last 30 days
  const dailyMap = new Map(dailyRows.map(r => [r.date, r.count]));
  const daily: RegistrationTrendEntry[] = [];
  let cumulative = 0;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = dailyMap.get(dateStr) || 0;
    cumulative += count;
    daily.push({ date: dateStr, count, cumulative });
  }

  // Weekly aggregation
  const weeklyMap = new Map<string, number>();
  for (const row of dailyRows) {
    const weekStart = new Date(row.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + row.count);
  }
  const weekly = [...weeklyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week, count }));

  // Summary
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const newThisWeek = db.prepare(
    `SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at >= ?`
  ).get(weekAgo) as { count: number };

  const newThisMonth = db.prepare(
    `SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at >= ?`
  ).get(monthAgo) as { count: number };

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM users WHERE role = 'student'`
  ).get() as { count: number };

  // Weekly growth rate
  let weeklyGrowthRate = 0;
  if (weekly.length >= 2) {
    const prevWeek = weekly[weekly.length - 2].count;
    const currWeek = weekly[weekly.length - 1].count;
    if (prevWeek > 0) {
      weeklyGrowthRate = Math.round(((currWeek - prevWeek) / prevWeek) * 1000) / 10;
    }
  }

  return {
    daily,
    weekly,
    summary: {
      new_this_week: newThisWeek.count,
      new_this_month: newThisMonth.count,
      total: total.count,
      weekly_growth_rate: weeklyGrowthRate,
    },
  };
}

// --- Activity Summary (DAU/WAU/MAU) ---

export interface ActivitySummaryEntry {
  date: string;
  dau: number;
  wau: number;
  mau: number;
}

export interface ActivitySummaryReport {
  daily: ActivitySummaryEntry[];
  summary: {
    current_dau: number;
    current_wau: number;
    current_mau: number;
    dau_wau_ratio: number;
    wau_mau_ratio: number;
  };
}

export function getActivitySummary(filters?: TimeRangeFilters): ActivitySummaryReport {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  // Get daily active users for last 30 days
  const dailyRows = db.prepare(`
    SELECT date(completed_at / 1000, 'unixepoch') as date,
           COUNT(DISTINCT user_id) as active_users
    FROM user_progress
    WHERE completed_at >= ?${dateCondition}
    GROUP BY date
    ORDER BY date
  `).all(now - 30 * dayMs, ...dateParams) as Array<{ date: string; active_users: number }>;

  const dailyMap = new Map(dailyRows.map(r => [r.date, r.active_users]));

  const daily: ActivitySummaryEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const ts = d.getTime();

    // DAU
    const dau = dailyMap.get(dateStr) || 0;

    // WAU (active in last 7 days from this date)
    const weekStart = ts - 7 * dayMs;
    let wau = 0;
    for (let j = 6; j >= 0; j--) {
      const checkDate = new Date(ts - j * dayMs);
      const checkStr = checkDate.toISOString().slice(0, 10);
      wau += dailyMap.get(checkStr) || 0;
    }
    // Actually count distinct users, not sum
    const wauRows = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_progress
      WHERE completed_at >= ? AND completed_at < ?
    `).get(weekStart, ts + dayMs) as { count: number };
    wau = wauRows.count;

    // MAU (active in last 30 days from this date)
    const monthStart = ts - 30 * dayMs;
    const mauRows = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_progress
      WHERE completed_at >= ? AND completed_at < ?
    `).get(monthStart, ts + dayMs) as { count: number };
    const mau = mauRows.count;

    daily.push({ date: dateStr, dau, wau, mau });
  }

  const currentDau = daily.length > 0 ? daily[daily.length - 1].dau : 0;
  const currentWau = daily.length > 0 ? daily[daily.length - 1].wau : 0;
  const currentMau = daily.length > 0 ? daily[daily.length - 1].mau : 0;

  return {
    daily,
    summary: {
      current_dau: currentDau,
      current_wau: currentWau,
      current_mau: currentMau,
      dau_wau_ratio: currentWau > 0 ? Math.round((currentDau / currentWau) * 100) / 100 : 0,
      wau_mau_ratio: currentMau > 0 ? Math.round((currentWau / currentMau) * 100) / 100 : 0,
    },
  };
}

// --- Hint Usage Analytics (Aggregate) ---

export interface HintUsageAnalyticsReport {
  total_hints_revealed: number;
  unique_students_used_hints: number;
  per_task: Array<{
    task_id: string;
    task_title: string;
    hint_count: number;
    unique_students: number;
    avg_attempts: number;
    completion_rate: number;
  }>;
  hint_reliance: Array<{
    user_id: string;
    user_name: string;
    hints_used: number;
    tasks_completed: number;
    hints_per_task: number;
    reliance_level: 'low' | 'medium' | 'high';
  }>;
  hint_completion_correlation: {
    with_hints_avg_attempts: number;
    without_hints_avg_attempts: number;
  };
}

export function getHintUsageAnalytics(filters?: TimeRangeFilters): HintUsageAnalyticsReport {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND h.revealed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND h.revealed_at <= ?';
    dateParams.push(filters.end_date);
  }

  // Total hints
  const totalHints = db.prepare(`
    SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
    FROM hint_usage h WHERE 1=1${dateCondition}
  `).all(...dateParams)[0] as { count: number; unique_users: number } || { count: 0, unique_users: 0 };

  // Per-task hint usage
  const perTask = db.prepare(`
    SELECT h.task_id,
           COUNT(*) as hint_count,
           COUNT(DISTINCT h.user_id) as unique_students
    FROM hint_usage h
    WHERE 1=1${dateCondition}
    GROUP BY h.task_id
    ORDER BY hint_count DESC
  `).all(...dateParams) as Array<{
    task_id: string;
    hint_count: number;
    unique_students: number;
  }>;

  const perTaskWithStats = perTask.map(t => {
    const taskProgress = db.prepare(`
      SELECT COUNT(*) as completions, ROUND(AVG(attempts * 1.0), 2) as avg_attempts
      FROM user_progress WHERE task_id = ?
    `).get(t.task_id) as { completions: number; avg_attempts: number } || { completions: 0, avg_attempts: 0 };

    const totalStudents = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    ).get() as { count: number };

    return {
      task_id: t.task_id,
      task_title: t.task_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      hint_count: t.hint_count,
      unique_students: t.unique_students,
      avg_attempts: taskProgress.avg_attempts || 0,
      completion_rate: totalStudents.count > 0 ? Math.round((taskProgress.completions / totalStudents.count) * 1000) / 10 : 0,
    };
  });

  // Hint reliance per student
  const hintReliance = db.prepare(`
    SELECT h.user_id, u.name, COUNT(*) as hints_used,
           (SELECT COUNT(*) FROM user_progress WHERE user_id = h.user_id) as tasks_completed
    FROM hint_usage h
    JOIN users u ON h.user_id = u.id
    GROUP BY h.user_id
    ORDER BY hints_used DESC
    LIMIT 50
  `).all() as Array<{
    user_id: string;
    user_name: string;
    hints_used: number;
    tasks_completed: number;
  }>;

  const hintRelianceWithLevel = hintReliance.map(r => {
    const hintsPerTask = r.tasks_completed > 0 ? Math.round((r.hints_used / r.tasks_completed) * 10) / 10 : r.hints_used;
    let relianceLevel: 'low' | 'medium' | 'high';
    if (hintsPerTask > 3) relianceLevel = 'high';
    else if (hintsPerTask > 1.5) relianceLevel = 'medium';
    else relianceLevel = 'low';

    return {
      user_id: r.user_id,
      user_name: r.user_name,
      hints_used: r.hints_used,
      tasks_completed: r.tasks_completed,
      hints_per_task: hintsPerTask,
      reliance_level: relianceLevel,
    };
  });

  // Correlation: avg attempts for students who used hints vs who didn't
  const hintUsers = db.prepare('SELECT DISTINCT user_id FROM hint_usage').all() as Array<{ user_id: string }>;
  const hintUserIds = new Set(hintUsers.map(u => u.user_id));

  const allStudents = db.prepare("SELECT id FROM users WHERE role = 'student'").all() as Array<{ id: string }>;
  const withHintsAttempts: number[] = [];
  const withoutHintsAttempts: number[] = [];

  for (const student of allStudents) {
    const progress = db.prepare(
      'SELECT AVG(attempts) as avg FROM user_progress WHERE user_id = ?'
    ).get(student.id) as { avg: number | null };
    if (progress.avg === null) continue;
    if (hintUserIds.has(student.id)) {
      withHintsAttempts.push(progress.avg);
    } else {
      withoutHintsAttempts.push(progress.avg);
    }
  }

  const withHintsAvg = withHintsAttempts.length > 0
    ? Math.round((withHintsAttempts.reduce((a, b) => a + b, 0) / withHintsAttempts.length) * 100) / 100
    : 0;
  const withoutHintsAvg = withoutHintsAttempts.length > 0
    ? Math.round((withoutHintsAttempts.reduce((a, b) => a + b, 0) / withoutHintsAttempts.length) * 100) / 100
    : 0;

  return {
    total_hints_revealed: totalHints.count,
    unique_students_used_hints: totalHints.unique_users,
    per_task: perTaskWithStats.slice(0, 20),
    hint_reliance: hintRelianceWithLevel,
    hint_completion_correlation: {
      with_hints_avg_attempts: withHintsAvg,
      without_hints_avg_attempts: withoutHintsAvg,
    },
  };
}

// --- Admin Action Audit Log ---

export interface AuditLogEntry {
  action_type: 'deadline_created' | 'deadline_updated' | 'role_changed' | 'notification_pref_changed';
  actor_id: string | null;
  actor_name: string | null;
  target_type: string;
  target_id: string;
  details: string;
  created_at: number;
}

export interface AuditLogReport {
  entries: AuditLogEntry[];
  summary: {
    total_actions: number;
    actions_by_type: Array<{ type: string; count: number }>;
    most_active_users: Array<{ name: string; action_count: number }>;
    actions_this_week: number;
    actions_this_month: number;
  };
}

export function getAuditLog(filters?: TimeRangeFilters): AuditLogReport {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND d.created_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND d.created_at <= ?';
    dateParams.push(filters.end_date);
  }

  const entries: AuditLogEntry[] = [];

  // Deadline actions
  const deadlineActions = db.prepare(`
    SELECT d.id, d.creator_id, d.title, d.type, d.target_type, d.created_at, d.updated_at,
           u.name as creator_name
    FROM deadlines d
    LEFT JOIN users u ON d.creator_id = u.id
    WHERE 1=1${dateCondition}
    ORDER BY d.created_at DESC
    LIMIT 100
  `).all(...dateParams) as Array<{
    id: string;
    creator_id: string;
    title: string;
    type: string;
    target_type: string;
    created_at: number;
    updated_at: number;
    creator_name: string | null;
  }>;

  for (const d of deadlineActions) {
    entries.push({
      action_type: 'deadline_created',
      actor_id: d.creator_id,
      actor_name: d.creator_name,
      target_type: 'deadline',
      target_id: d.id,
      details: `Created deadline "${d.title}" (${d.type}, target: ${d.target_type})`,
      created_at: d.created_at,
    });
  }

  // Role change actions (from users.updated_at changes — approximate)
  const roleActions = db.prepare(`
    SELECT u.id, u.name, u.role, u.updated_at
    FROM users u
    WHERE u.role IN ('teacher', 'admin')
    ORDER BY u.updated_at DESC
    LIMIT 50
  `).all() as Array<{
    id: string;
    name: string;
    role: string;
    updated_at: number;
  }>;

  for (const u of roleActions) {
    entries.push({
      action_type: 'role_changed',
      actor_id: null,
      actor_name: null,
      target_type: 'user',
      target_id: u.id,
      details: `User "${u.name}" has role "${u.role}"`,
      created_at: u.updated_at,
    });
  }

  entries.sort((a, b) => b.created_at - a.created_at);

  // Summary
  const actionsByType = new Map<string, number>();
  const userActionCount = new Map<string, number>();

  for (const entry of entries) {
    actionsByType.set(entry.action_type, (actionsByType.get(entry.action_type) || 0) + 1);
    if (entry.actor_name) {
      userActionCount.set(entry.actor_name, (userActionCount.get(entry.actor_name) || 0) + 1);
    }
  }

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  return {
    entries: entries.slice(0, 100),
    summary: {
      total_actions: entries.length,
      actions_by_type: [...actionsByType.entries()].map(([type, count]) => ({ type, count })),
      most_active_users: [...userActionCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, action_count: count })),
      actions_this_week: entries.filter(e => e.created_at >= weekAgo).length,
      actions_this_month: entries.filter(e => e.created_at >= monthAgo).length,
    },
  };
}

// --- Weekday vs Weekend Performance ---

export interface WeekdayVsWeekendReport {
  weekday: {
    total_completions: number;
    unique_students: number;
    avg_attempts: number;
    first_attempt_rate: number;
  };
  weekend: {
    total_completions: number;
    unique_students: number;
    avg_attempts: number;
    first_attempt_rate: number;
  };
  by_difficulty: Array<{
    difficulty: string;
    weekday_completions: number;
    weekend_completions: number;
    weekday_avg_attempts: number;
    weekend_avg_attempts: number;
  }>;
  hourly_weekday: Array<{
    hour: number;
    completions: number;
  }>;
  hourly_weekend: Array<{
    hour: number;
    completions: number;
  }>;
}

export function getWeekdayVsWeekendPerformance(filters?: TimeRangeFilters): WeekdayVsWeekendReport {
  const db = getDb();

  let dateCondition = '';
  const dateParams: any[] = [];
  if (filters?.start_date) {
    dateCondition += ' AND completed_at >= ?';
    dateParams.push(filters.start_date);
  }
  if (filters?.end_date) {
    dateCondition += ' AND completed_at <= ?';
    dateParams.push(filters.end_date);
  }

  // Weekday (Mon-Fri: day_of_week 1-5)
  const weekday = db.prepare(`
    SELECT COUNT(*) as total_completions,
           COUNT(DISTINCT user_id) as unique_students,
           ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
           ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
    FROM user_progress
    WHERE CAST(STRFTIME('%w', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) BETWEEN 1 AND 5
    ${dateCondition}
  `).all(...dateParams)[0] as { total_completions: number; unique_students: number; avg_attempts: number; first_attempt_rate: number } || { total_completions: 0, unique_students: 0, avg_attempts: 0, first_attempt_rate: 0 };

  // Weekend (Sat-Sun: day_of_week 0,6)
  const weekend = db.prepare(`
    SELECT COUNT(*) as total_completions,
           COUNT(DISTINCT user_id) as unique_students,
           ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
           ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
    FROM user_progress
    WHERE CAST(STRFTIME('%w', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) IN (0, 6)
    ${dateCondition}
  `).all(...dateParams)[0] as { total_completions: number; unique_students: number; avg_attempts: number; first_attempt_rate: number } || { total_completions: 0, unique_students: 0, avg_attempts: 0, first_attempt_rate: 0 };

  // By difficulty
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const byDifficulty = difficulties.map(diff => {
    const wd = db.prepare(`
      SELECT COUNT(*) as completions,
             ROUND(AVG(attempts * 1.0), 2) as avg_attempts
      FROM user_progress
      WHERE task_id LIKE '${diff}-%'
        AND CAST(STRFTIME('%w', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) BETWEEN 1 AND 5
        ${dateCondition}
    `).all(...dateParams)[0] as { completions: number; avg_attempts: number } || { completions: 0, avg_attempts: 0 };

    const we = db.prepare(`
      SELECT COUNT(*) as completions,
             ROUND(AVG(attempts * 1.0), 2) as avg_attempts
      FROM user_progress
      WHERE task_id LIKE '${diff}-%'
        AND CAST(STRFTIME('%w', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) IN (0, 6)
        ${dateCondition}
    `).all(...dateParams)[0] as { completions: number; avg_attempts: number } || { completions: 0, avg_attempts: 0 };

    return {
      difficulty: diff,
      weekday_completions: wd.completions,
      weekend_completions: we.completions,
      weekday_avg_attempts: wd.avg_attempts,
      weekend_avg_attempts: we.avg_attempts,
    };
  });

  // Hourly breakdown
  const hourlyWeekday = db.prepare(`
    SELECT CAST(STRFTIME('%H', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) as hour,
           COUNT(*) as completions
    FROM user_progress
    WHERE CAST(STRFTIME('%w', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) BETWEEN 1 AND 5
    ${dateCondition}
    GROUP BY hour
    ORDER BY hour
  `).all(...dateParams) as Array<{ hour: number; completions: number }>;

  const hourlyWeekend = db.prepare(`
    SELECT CAST(STRFTIME('%H', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) as hour,
           COUNT(*) as completions
    FROM user_progress
    WHERE CAST(STRFTIME('%w', DATE(completed_at / 1000, 'unixepoch')) AS INTEGER) IN (0, 6)
    ${dateCondition}
    GROUP BY hour
    ORDER BY hour
  `).all(...dateParams) as Array<{ hour: number; completions: number }>;

  // Fill missing hours
  const weekdayHourlyMap = new Map(hourlyWeekday.map(r => [r.hour, r.completions]));
  const weekendHourlyMap = new Map(hourlyWeekend.map(r => [r.hour, r.completions]));

  const hourlyWeekdayFilled = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    completions: weekdayHourlyMap.get(i) || 0,
  }));
  const hourlyWeekendFilled = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    completions: weekendHourlyMap.get(i) || 0,
  }));

  return {
    weekday,
    weekend,
    by_difficulty: byDifficulty,
    hourly_weekday: hourlyWeekdayFilled,
    hourly_weekend: hourlyWeekendFilled,
  };
}

// ==================== Real-time / Live Activity ====================

export function getLiveActivity(): {
  active_now: number;
  active_last_5min: Array<{ id: string; name: string; email: string; last_active: number }>;
  active_last_hour: number;
  active_last_24h: number;
} {
  const db = getDb();
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const twentyFourHAgo = now - 24 * 60 * 60 * 1000;

  const activeLast5min = db.prepare(`
    SELECT id, name, email, last_active
    FROM users
    WHERE last_active IS NOT NULL AND last_active >= ?
    ORDER BY last_active DESC
    LIMIT 50
  `).all(fiveMinAgo) as Array<{ id: string; name: string; email: string; last_active: number }>;

  const activeLastHour = db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE last_active IS NOT NULL AND last_active >= ?
  `).get(oneHourAgo) as { count: number };

  const activeLast24h = db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE last_active IS NOT NULL AND last_active >= ?
  `).get(twentyFourHAgo) as { count: number };

  return {
    active_now: activeLast5min.length,
    active_last_5min: activeLast5min,
    active_last_hour: activeLastHour.count,
    active_last_24h: activeLast24h.count,
  };
}

// ==================== Student Learning Plans ====================

export function generateLearningPlan(userId: string): {
  student_name: string;
  current_level: string;
  completed_tasks: number;
  remaining_tasks: number;
  completed_by_difficulty: { beginner: number; intermediate: number; advanced: number };
  next_tasks: Array<{ task_id: string; task_title: string; difficulty: string; estimated_hours: number }>;
  milestones: Array<{ milestone: string; target_date: string }>;
  risk_factors: string[];
} | null {
  const db = getDb();
  const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(userId) as { id: string; name: string; role: string } | undefined;
  if (!user) return null;

  const progress = getStudentProgressById(userId);
  if (!progress) return null;

  // Get all completed task IDs for this user
  const completedTaskIds = (db.prepare(`
    SELECT task_id FROM user_progress WHERE user_id = ?
  `).all(userId) as { task_id: string }[]).map(r => r.task_id);

  const completedCount = completedTaskIds.length;

  // Count by difficulty
  const allTasks = db.prepare(`
    SELECT id, title, difficulty FROM tasks ORDER BY difficulty, title
  `).all() as Array<{ id: string; title: string; difficulty: string }>;

  const completedByDiff = { beginner: 0, intermediate: 0, advanced: 0 };
  const remainingByDiff: Array<{ id: string; title: string; difficulty: string }> = [];

  for (const task of allTasks) {
    if (completedTaskIds.includes(task.id)) {
      completedByDiff[task.difficulty as keyof typeof completedByDiff]++;
    } else {
      remainingByDiff.push(task);
    }
  }

  // Determine current level
  let currentLevel = 'beginner';
  if (completedByDiff.beginner >= 8) currentLevel = 'intermediate';
  if (completedByDiff.intermediate >= 15) currentLevel = 'advanced';

  // Calculate velocity (tasks per week)
  const recentProgress = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress
    WHERE user_id = ? AND completed_at >= ?
  `).get(userId, Date.now() - 7 * 24 * 60 * 60 * 1000) as { count: number };

  const velocity = recentProgress.count || 1; // At least 1 task/week estimate
  const remainingTasks = remainingByDiff.length;
  const estimatedWeeks = Math.ceil(remainingTasks / velocity);

  // Recommend next 5 tasks based on weak areas
  const nextTasks: Array<{ task_id: string; task_title: string; difficulty: string; estimated_hours: number }> = [];

  // Prioritize: complete current level first, then move up
  const priorityOrder = currentLevel === 'beginner'
    ? ['beginner', 'intermediate']
    : currentLevel === 'intermediate'
      ? ['intermediate', 'advanced']
      : ['advanced'];

  for (const diff of priorityOrder) {
    const candidates = remainingByDiff.filter(t => t.difficulty === diff);
    for (const task of candidates.slice(0, 5 - nextTasks.length)) {
      nextTasks.push({
        task_id: task.id,
        task_title: task.title,
        difficulty: task.difficulty,
        estimated_hours: diff === 'beginner' ? 0.5 : diff === 'intermediate' ? 1 : 1.5,
      });
    }
    if (nextTasks.length >= 5) break;
  }

  // Generate milestones
  const milestones: Array<{ milestone: string; target_date: string }> = [];
  const now = new Date();

  if (completedByDiff.beginner < 8) {
    const beginnerRemaining = 8 - completedByDiff.beginner;
    const beginnerWeeks = Math.ceil(beginnerRemaining / velocity);
    const targetDate = new Date(now.getTime() + beginnerWeeks * 7 * 24 * 60 * 60 * 1000);
    milestones.push({
      milestone: 'Complete all beginner tasks',
      target_date: targetDate.toISOString().slice(0, 10),
    });
  }

  if (completedByDiff.intermediate < 15) {
    const intermediateRemaining = 15 - completedByDiff.intermediate;
    const intermediateWeeks = Math.ceil((completedByDiff.beginner >= 8 ? intermediateRemaining : intermediateRemaining + 8 - completedByDiff.beginner) / velocity);
    const targetDate = new Date(now.getTime() + intermediateWeeks * 7 * 24 * 60 * 60 * 1000);
    milestones.push({
      milestone: 'Complete all intermediate tasks',
      target_date: targetDate.toISOString().slice(0, 10),
    });
  }

  // Risk factors
  const riskFactors: string[] = [];
  const lastActive = progress.last_active;
  if (lastActive && (now.getTime() - lastActive) > 7 * 24 * 60 * 60 * 1000) {
    riskFactors.push('Inactive for 7+ days');
  }
  if (progress.avg_attempts > 3) {
    riskFactors.push('High average attempts per task');
  }
  if (completedCount === 0) {
    riskFactors.push('No tasks completed yet');
  }
  if (velocity < 1) {
    riskFactors.push('Low completion velocity');
  }

  return {
    student_name: user.name,
    current_level: currentLevel,
    completed_tasks: completedCount,
    remaining_tasks: remainingTasks,
    completed_by_difficulty: completedByDiff,
    next_tasks: nextTasks,
    milestones,
    risk_factors: riskFactors,
  };
}

// ==================== A/B Testing ====================

export function getABTestComparison(testType: string = 'learning_path'): {
  test_name: string;
  group_a: { name: string; count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };
  group_b: { name: string; count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };
  metrics: Array<{ metric: string; group_a: number; group_b: number; difference: number; significant: boolean }>;
} {
  const db = getDb();

  // Sequential vs Random learning path comparison
  if (testType === 'learning_path') {
    // Group A: students with >50% tasks completed in order (by task ID sort)
    // Group B: students with random order completion
    // Simplified: use streak as proxy - high streak = sequential, low = random

    const groupA = db.prepare(`
      SELECT COUNT(DISTINCT up.user_id) as count,
             AVG(subq.attempts) as avg_attempts,
             CAST(SUM(CASE WHEN subq.completed >= 10 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT up.user_id) * 100 as completion_rate,
             AVG(subq.avg_time) / 3600000 as avg_time_hours
      FROM user_progress up
      JOIN (
        SELECT user_id,
               COUNT(*) as completed,
               AVG(attempts) as attempts,
               AVG(CASE WHEN completed_at IS NOT NULL AND created_at IS NOT NULL
                        THEN completed_at - created_at ELSE 0 END) as avg_time
        FROM user_progress
        GROUP BY user_id
        HAVING completed >= 5
      ) subq ON up.user_id = subq.user_id
      JOIN users u ON up.user_id = u.id
      WHERE u.streak_current >= 7
    `).get() as { count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };

    const groupB = db.prepare(`
      SELECT COUNT(DISTINCT up.user_id) as count,
             AVG(subq.attempts) as avg_attempts,
             CAST(SUM(CASE WHEN subq.completed >= 10 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT up.user_id) * 100 as completion_rate,
             AVG(subq.avg_time) / 3600000 as avg_time_hours
      FROM user_progress up
      JOIN (
        SELECT user_id,
               COUNT(*) as completed,
               AVG(attempts) as attempts,
               AVG(CASE WHEN completed_at IS NOT NULL AND created_at IS NOT NULL
                        THEN completed_at - created_at ELSE 0 END) as avg_time
        FROM user_progress
        GROUP BY user_id
        HAVING completed >= 5
      ) subq ON up.user_id = subq.user_id
      JOIN users u ON up.user_id = u.id
      WHERE u.streak_current < 7
    `).get() as { count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };

    const metrics = [
      {
        metric: 'Avg Attempts',
        group_a: parseFloat((groupA.avg_attempts || 0).toFixed(2)),
        group_b: parseFloat((groupB.avg_attempts || 0).toFixed(2)),
        difference: parseFloat(((groupA.avg_attempts || 0) - (groupB.avg_attempts || 0)).toFixed(2)),
        significant: Math.abs((groupA.avg_attempts || 0) - (groupB.avg_attempts || 0)) > 0.5,
      },
      {
        metric: 'Completion Rate (%)',
        group_a: parseFloat((groupA.completion_rate || 0).toFixed(1)),
        group_b: parseFloat((groupB.completion_rate || 0).toFixed(1)),
        difference: parseFloat(((groupA.completion_rate || 0) - (groupB.completion_rate || 0)).toFixed(1)),
        significant: Math.abs((groupA.completion_rate || 0) - (groupB.completion_rate || 0)) > 10,
      },
      {
        metric: 'Avg Time (hours)',
        group_a: parseFloat((groupA.avg_time_hours || 0).toFixed(2)),
        group_b: parseFloat((groupB.avg_time_hours || 0).toFixed(2)),
        difference: parseFloat(((groupA.avg_time_hours || 0) - (groupB.avg_time_hours || 0)).toFixed(2)),
        significant: Math.abs((groupA.avg_time_hours || 0) - (groupB.avg_time_hours || 0)) > 1,
      },
    ];

    return {
      test_name: 'Sequential vs Random Learning Path',
      group_a: {
        name: 'Sequential (streak >= 7)',
        count: groupA.count || 0,
        avg_attempts: parseFloat((groupA.avg_attempts || 0).toFixed(2)),
        completion_rate: parseFloat((groupA.completion_rate || 0).toFixed(1)),
        avg_time_hours: parseFloat((groupA.avg_time_hours || 0).toFixed(2)),
      },
      group_b: {
        name: 'Random (streak < 7)',
        count: groupB.count || 0,
        avg_attempts: parseFloat((groupB.avg_attempts || 0).toFixed(2)),
        completion_rate: parseFloat((groupB.completion_rate || 0).toFixed(1)),
        avg_time_hours: parseFloat((groupB.avg_time_hours || 0).toFixed(2)),
      },
      metrics,
    };
  }

  // Hint vs No-Hint comparison
  if (testType === 'hint_usage') {
    const hintUsers = (db.prepare(`
      SELECT DISTINCT user_id FROM hint_usage
    `).all() as { user_id: string }[]).map(r => r.user_id);

    const groupA = db.prepare(`
      SELECT COUNT(DISTINCT up.user_id) as count,
             AVG(subq.attempts) as avg_attempts,
             CAST(SUM(CASE WHEN subq.completed >= 10 THEN 1 ELSE 0 END) AS FLOAT) / MAX(COUNT(DISTINCT up.user_id), 1) * 100 as completion_rate,
             AVG(subq.avg_time) / 3600000 as avg_time_hours
      FROM user_progress up
      JOIN (
        SELECT user_id, COUNT(*) as completed, AVG(attempts) as attempts,
               AVG(CASE WHEN completed_at IS NOT NULL THEN completed_at - created_at ELSE 0 END) as avg_time
        FROM user_progress GROUP BY user_id
      ) subq ON up.user_id = subq.user_id
      WHERE up.user_id IN (${hintUsers.length ? hintUsers.map(() => '?').join(',') : "SELECT NULL"})
    `).get(...hintUsers.length ? hintUsers : ['']) as { count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };

    const groupB = db.prepare(`
      SELECT COUNT(DISTINCT up.user_id) as count,
             AVG(subq.attempts) as avg_attempts,
             CAST(SUM(CASE WHEN subq.completed >= 10 THEN 1 ELSE 0 END) AS FLOAT) / MAX(COUNT(DISTINCT up.user_id), 1) * 100 as completion_rate,
             AVG(subq.avg_time) / 3600000 as avg_time_hours
      FROM user_progress up
      JOIN (
        SELECT user_id, COUNT(*) as completed, AVG(attempts) as attempts,
               AVG(CASE WHEN completed_at IS NOT NULL THEN completed_at - created_at ELSE 0 END) as avg_time
        FROM user_progress GROUP BY user_id
      ) subq ON up.user_id = subq.user_id
      WHERE up.user_id NOT IN (${hintUsers.length ? hintUsers.map(() => '?').join(',') : "SELECT NULL"})
    `).get(...hintUsers.length ? hintUsers : ['']) as { count: number; avg_attempts: number; completion_rate: number; avg_time_hours: number };

    const metrics = [
      {
        metric: 'Avg Attempts',
        group_a: parseFloat((groupA?.avg_attempts || 0).toFixed(2)),
        group_b: parseFloat((groupB?.avg_attempts || 0).toFixed(2)),
        difference: parseFloat(((groupA?.avg_attempts || 0) - (groupB?.avg_attempts || 0)).toFixed(2)),
        significant: Math.abs((groupA?.avg_attempts || 0) - (groupB?.avg_attempts || 0)) > 0.5,
      },
      {
        metric: 'Completion Rate (%)',
        group_a: parseFloat((groupA?.completion_rate || 0).toFixed(1)),
        group_b: parseFloat((groupB?.completion_rate || 0).toFixed(1)),
        difference: parseFloat(((groupA?.completion_rate || 0) - (groupB?.completion_rate || 0)).toFixed(1)),
        significant: Math.abs((groupA?.completion_rate || 0) - (groupB?.completion_rate || 0)) > 10,
      },
    ];

    return {
      test_name: 'Hint Usage vs Independent',
      group_a: {
        name: 'Used Hints',
        count: groupA?.count || 0,
        avg_attempts: parseFloat((groupA?.avg_attempts || 0).toFixed(2)),
        completion_rate: parseFloat((groupA?.completion_rate || 0).toFixed(1)),
        avg_time_hours: parseFloat((groupA?.avg_time_hours || 0).toFixed(2)),
      },
      group_b: {
        name: 'No Hints',
        count: groupB?.count || 0,
        avg_attempts: parseFloat((groupB?.avg_attempts || 0).toFixed(2)),
        completion_rate: parseFloat((groupB?.completion_rate || 0).toFixed(1)),
        avg_time_hours: parseFloat((groupB?.avg_time_hours || 0).toFixed(2)),
      },
      metrics,
    };
  }

  // Default fallback
  return {
    test_name: 'No Test Selected',
    group_a: { name: 'Group A', count: 0, avg_attempts: 0, completion_rate: 0, avg_time_hours: 0 },
    group_b: { name: 'Group B', count: 0, avg_attempts: 0, completion_rate: 0, avg_time_hours: 0 },
    metrics: [],
  };
}

// ==================== Teacher Effectiveness ====================

export function getTeacherEffectiveness(): {
  teachers: Array<{
    id: string;
    name: string;
    student_count: number;
    avg_completion_rate: number;
    avg_attempts: number;
    avg_growth_rate: number;
  }>;
  summary: { total_teachers: number; avg_student_per_teacher: number; top_teacher: string };
} {
  const db = getDb();

  const teachers = db.prepare(`
    SELECT id, name FROM users WHERE role IN ('teacher', 'admin') ORDER BY created_at
  `).all() as Array<{ id: string; name: string }>;

  const teacherStats = teachers.map(teacher => {
    // Find students associated with this teacher via deadlines they created
    const students = db.prepare(`
      SELECT DISTINCT up.user_id,
             COUNT(up.task_id) as tasks_completed,
             AVG(up.attempts) as avg_attempts
      FROM user_progress up
      JOIN deadlines d ON up.task_id = d.task_id
      WHERE d.creator_id = ?
      GROUP BY up.user_id
    `).all(teacher.id) as Array<{ user_id: string; tasks_completed: number; avg_attempts: number }>;

    // Also count all students if teacher is admin (global)
    const allStudents = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `).get() as { count: number };

    const studentCount = students.length > 0 ? students.length : (teacher.name.toLowerCase().includes('admin') ? allStudents.count : 0);
    const avgAttempts = students.length > 0
      ? parseFloat((students.reduce((s, st) => s + st.avg_attempts, 0) / students.length).toFixed(2))
      : 0;

    const totalTasks = 48; // Total training tasks
    const avgCompletionRate = students.length > 0
      ? parseFloat(((students.reduce((s, st) => s + st.tasks_completed, 0) / students.length / totalTasks) * 100).toFixed(1))
      : 0;

    return {
      id: teacher.id,
      name: teacher.name,
      student_count: studentCount,
      avg_completion_rate: avgCompletionRate,
      avg_attempts: avgAttempts,
      avg_growth_rate: parseFloat((avgCompletionRate / Math.max(studentCount, 1)).toFixed(1)),
    };
  });

  const withStudents = teacherStats.filter(t => t.student_count > 0);
  const topTeacher = withStudents.length > 0
    ? withStudents.reduce((a, b) => a.avg_completion_rate > b.avg_completion_rate ? a : b).name
    : 'N/A';

  return {
    teachers: teacherStats.sort((a, b) => b.avg_completion_rate - a.avg_completion_rate),
    summary: {
      total_teachers: teachers.length,
      avg_student_per_teacher: teachers.length > 0 ? parseFloat((teacherStats.reduce((s, t) => s + t.student_count, 0) / teachers.length).toFixed(1)) : 0,
      top_teacher: topTeacher,
    },
  };
}

// ==================== Retention Cohorts ====================

export function getRetentionCohorts(): {
  cohorts: Array<{
    cohort_week: string;
    total: number;
    week_1_retained: number;
    week_1_rate: number;
    week_2_retained: number;
    week_2_rate: number;
    week_4_retained: number;
    week_4_rate: number;
    week_8_retained: number;
    week_8_rate: number;
  }>;
  summary: { avg_week_1_rate: number; avg_week_4_rate: number; avg_week_8_rate: number };
} {
  const db = getDb();

  // Single query with conditional aggregation — replaces O(N*M*K) individual queries
  const cohorts = db.prepare(`
    SELECT
      STRFTIME('%Y-%W', DATETIME(u.created_at / 1000, 'unixepoch')) as cohort_week,
      COUNT(DISTINCT u.id) as total,
      COUNT(DISTINCT CASE WHEN up1.user_id IS NOT NULL THEN u.id END) as week_1_retained,
      COUNT(DISTINCT CASE WHEN up2.user_id IS NOT NULL THEN u.id END) as week_2_retained,
      COUNT(DISTINCT CASE WHEN up4.user_id IS NOT NULL THEN u.id END) as week_4_retained,
      COUNT(DISTINCT CASE WHEN up8.user_id IS NOT NULL THEN u.id END) as week_8_retained
    FROM users u
    LEFT JOIN user_progress up1 ON u.id = up1.user_id
      AND up1.completed_at >= u.created_at + 604800000
    LEFT JOIN user_progress up2 ON u.id = up2.user_id
      AND up2.completed_at >= u.created_at + 1209600000
    LEFT JOIN user_progress up4 ON u.id = up4.user_id
      AND up4.completed_at >= u.created_at + 2419200000
    LEFT JOIN user_progress up8 ON u.id = up8.user_id
      AND up8.completed_at >= u.created_at + 4838400000
    WHERE u.role = 'student'
    GROUP BY cohort_week
    ORDER BY cohort_week
    LIMIT 20
  `).all() as Array<{
    cohort_week: string;
    total: number;
    week_1_retained: number;
    week_2_retained: number;
    week_4_retained: number;
    week_8_retained: number;
  }>;

  const cohortData = cohorts.map(cohort => ({
    cohort_week: cohort.cohort_week,
    total: cohort.total,
    week_1_retained: cohort.week_1_retained,
    week_1_rate: cohort.total > 0 ? parseFloat(((cohort.week_1_retained / cohort.total) * 100).toFixed(1)) : 0,
    week_2_retained: cohort.week_2_retained,
    week_2_rate: cohort.total > 0 ? parseFloat(((cohort.week_2_retained / cohort.total) * 100).toFixed(1)) : 0,
    week_4_retained: cohort.week_4_retained,
    week_4_rate: cohort.total > 0 ? parseFloat(((cohort.week_4_retained / cohort.total) * 100).toFixed(1)) : 0,
    week_8_retained: cohort.week_8_retained,
    week_8_rate: cohort.total > 0 ? parseFloat(((cohort.week_8_retained / cohort.total) * 100).toFixed(1)) : 0,
  }));

  const avgW1 = cohortData.length > 0 ? parseFloat((cohortData.reduce((s, c) => s + c.week_1_rate, 0) / cohortData.length).toFixed(1)) : 0;
  const avgW4 = cohortData.length > 0 ? parseFloat((cohortData.reduce((s, c) => s + c.week_4_rate, 0) / cohortData.length).toFixed(1)) : 0;
  const avgW8 = cohortData.length > 0 ? parseFloat((cohortData.reduce((s, c) => s + c.week_8_rate, 0) / cohortData.length).toFixed(1)) : 0;

  return {
    cohorts: cohortData,
    summary: {
      avg_week_1_rate: avgW1,
      avg_week_4_rate: avgW4,
      avg_week_8_rate: avgW8,
    },
  };
}

// ==================== Topic Mastery ====================

export function getTopicMastery(): {
  by_category: Array<{
    category: string;
    task_count: number;
    total_completions: number;
    unique_students: number;
    avg_attempts: number;
    completion_rate: number;
  }>;
  by_difficulty: Array<{
    difficulty: string;
    task_count: number;
    total_completions: number;
    unique_students: number;
    avg_attempts: number;
    first_attempt_rate: number;
  }>;
  hardest_tasks: Array<{
    task_id: string;
    task_title: string;
    difficulty: string;
    category: string;
    completions: number;
    avg_attempts: number;
    failure_rate: number;
  }>;
} {
  const db = getDb();

  const tasks = TRAINING_TASKS as Array<{ id: string; title: string; difficulty: string; category?: string }>;

  const categoryMap = new Map<string, string[]>();
  const difficultyMap = new Map<string, string[]>();

  for (const task of tasks) {
    const cat = task.category || 'general';
    const catEntry = categoryMap.get(cat);
    if (catEntry) {
      catEntry.push(task.id);
    } else {
      categoryMap.set(cat, [task.id]);
    }

    const diffEntry = difficultyMap.get(task.difficulty);
    if (diffEntry) {
      diffEntry.push(task.id);
    } else {
      difficultyMap.set(task.difficulty, [task.id]);
    }
  }

  // By category
  const byCategory = Array.from(categoryMap.entries()).map(([category, taskIds]) => {
    const placeholders = taskIds.map(() => '?').join(',');
    const stats = db.prepare(`
      SELECT COUNT(*) as total_completions,
             COUNT(DISTINCT user_id) as unique_students,
             AVG(attempts) as avg_attempts
      FROM user_progress
      WHERE task_id IN (${placeholders})
    `).all(...taskIds) as Array<{ total_completions: number; unique_students: number; avg_attempts: number }>;

    const totalCompletions = stats.reduce((s, st) => s + st.total_completions, 0);
    const uniqueStudents = stats.reduce((s, st) => s + st.unique_students, 0);
    const avgAttempts = stats.length > 0 ? parseFloat((stats.reduce((s, st) => s + st.avg_attempts, 0) / stats.length).toFixed(2)) : 0;
    const maxPossible = taskIds.length * uniqueStudents;
    const completionRate = maxPossible > 0 ? parseFloat(((totalCompletions / maxPossible) * 100).toFixed(1)) : 0;

    return {
      category,
      task_count: taskIds.length,
      total_completions: totalCompletions,
      unique_students: uniqueStudents,
      avg_attempts: avgAttempts,
      completion_rate: completionRate,
    };
  }).sort((a, b) => b.completion_rate - a.completion_rate);

  // By difficulty
  const byDifficulty = Array.from(difficultyMap.entries()).map(([difficulty, taskIds]) => {
    const placeholders = taskIds.map(() => '?').join(',');
    const stats = db.prepare(`
      SELECT COUNT(*) as total_completions,
             COUNT(DISTINCT user_id) as unique_students,
             AVG(attempts) as avg_attempts,
             CAST(SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) AS FLOAT) / MAX(COUNT(*), 1) * 100 as first_attempt_rate
      FROM user_progress
      WHERE task_id IN (${placeholders})
    `).all(...taskIds) as Array<{ total_completions: number; unique_students: number; avg_attempts: number; first_attempt_rate: number }>;

    return {
      difficulty,
      task_count: taskIds.length,
      total_completions: stats.reduce((s, st) => s + st.total_completions, 0),
      unique_students: stats.reduce((s, st) => s + st.unique_students, 0),
      avg_attempts: parseFloat((stats.reduce((s, st) => s + st.avg_attempts, 0) / Math.max(stats.length, 1)).toFixed(2)),
      first_attempt_rate: parseFloat((stats.reduce((s, st) => s + st.first_attempt_rate, 0) / Math.max(stats.length, 1)).toFixed(1)),
    };
  });

  // Hardest tasks (highest avg attempts, lowest completion)
  const allTaskStats = tasks.slice(0, 20).map(task => {
    const stat = db.prepare(`
      SELECT COUNT(*) as completions, AVG(attempts) as avg_attempts,
             CAST(SUM(CASE WHEN attempts > 3 THEN 1 ELSE 0 END) AS FLOAT) / MAX(COUNT(*), 1) * 100 as failure_rate
      FROM user_progress WHERE task_id = ?
    `).get(task.id) as { completions: number; avg_attempts: number; failure_rate: number };

    return {
      task_id: task.id,
      task_title: task.title,
      difficulty: task.difficulty,
      category: task.category || 'general',
      completions: stat.completions,
      avg_attempts: parseFloat((stat.avg_attempts || 0).toFixed(2)),
      failure_rate: parseFloat((stat.failure_rate || 0).toFixed(1)),
    };
  }).sort((a, b) => b.avg_attempts - a.avg_attempts).slice(0, 15);

  return {
    by_category: byCategory,
    by_difficulty: byDifficulty,
    hardest_tasks: allTaskStats,
  };
}

// ==================== Executive Summary ====================

export function getExecutiveSummary(filters?: TimeRangeFilters) {
  const db = getDb();
  const dateFilter = filters?.start_date && filters?.end_date
    ? `WHERE created_at >= ${filters.start_date} AND created_at <= ${filters.end_date}`
    : '';
  const progressDateFilter = filters?.start_date && filters?.end_date
    ? `WHERE completed_at >= ${filters.start_date} AND completed_at <= ${filters.end_date}`
    : '';
  const prevStart = filters?.start_date && filters?.end_date ? filters.start_date - (filters.end_date - filters.start_date) : null;
  const prevEnd = filters?.end_date ? filters.start_date : null;

  // Current period stats
  const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).get() as { count: number };
  const activeNow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student' AND last_active >= ?`).get(Date.now() - 7 * 24 * 60 * 60 * 1000) as { count: number };
  const totalCompletions = db.prepare(`SELECT COUNT(*) as count FROM user_progress ${progressDateFilter}`).get() as { count: number };
  const avgAttempts = db.prepare(`SELECT AVG(attempts) as avg FROM user_progress ${progressDateFilter}`).get() as { avg: number | null };
  const newRegistrations = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student' ${dateFilter ? dateFilter.replace('created_at', 'created_at') : ''}`).get() as { count: number };

  // Previous period for comparison
  let prevRegistrations = 0;
  let prevCompletions = 0;
  if (prevStart && prevEnd) {
    const prevReg = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at >= ? AND created_at <= ?`).get(prevStart, prevEnd) as { count: number };
    const prevComp = db.prepare(`SELECT COUNT(*) as count FROM user_progress WHERE completed_at >= ? AND completed_at <= ?`).get(prevStart, prevEnd) as { count: number };
    prevRegistrations = prevReg.count;
    prevCompletions = prevComp.count;
  }

  // Grade distribution
  const totalTasks = db.prepare(`SELECT COUNT(*) as count FROM user_progress`).get() as { count: number };
  const studentsWithProgress = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM user_progress`).get() as { count: number };
  const avgCompletionRate = studentsWithProgress.count > 0
    ? parseFloat(((totalCompletions.count / (studentsWithProgress.count * 20)) * 100).toFixed(1))
    : 0;

  // Pending emails
  const pendingEmails = db.prepare(`SELECT COUNT(*) as count FROM email_queue WHERE status = 'pending'`).get() as { count: number };

  // Push subscriptions
  const pushSubs = db.prepare(`SELECT COUNT(*) as count FROM push_subscriptions`).get() as { count: number };

  const regTrend = prevRegistrations > 0
    ? parseFloat((((newRegistrations.count - prevRegistrations) / prevRegistrations) * 100).toFixed(1))
    : 0;
  const compTrend = prevCompletions > 0
    ? parseFloat((((totalCompletions.count - prevCompletions) / prevCompletions) * 100).toFixed(1))
    : 0;

  return {
    total_students: totalStudents.count,
    active_this_week: activeNow.count,
    total_completions: totalCompletions.count,
    avg_attempts: avgAttempts.avg ? parseFloat(avgAttempts.avg.toFixed(2)) : 0,
    new_registrations: newRegistrations.count,
    avg_completion_rate: avgCompletionRate,
    pending_emails: pendingEmails.count,
    push_subscriptions: pushSubs.count,
    trends: {
      registrations_change: regTrend,
      completions_change: compTrend,
    },
  };
}

// ==================== Platform Health ====================

export function getPlatformHealth() {
  const db = getDb();
  const tables = db.pragma('table_list') as { name: string }[];

  const tableStats = tables.map(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get() as { count: number };
    return { name: table.name, rows: count.count };
  });

  const pendingEmails = db.prepare(`SELECT COUNT(*) as count FROM email_queue WHERE status = 'pending'`).get() as { count: number };
  const failedEmails = db.prepare(`SELECT COUNT(*) as count FROM email_queue WHERE status = 'failed'`).get() as { count: number };
  const pendingReminders = db.prepare(`SELECT COUNT(*) as count FROM reminder_schedule WHERE status = 'pending'`).get() as { count: number };
  const pushSubs = db.prepare(`SELECT COUNT(*) as count FROM push_subscriptions`).get() as { count: number };
  const activeUsers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE last_active >= ?`).get(Date.now() - 24 * 60 * 60 * 1000) as { count: number };

  return {
    tables: tableStats,
    email_queue: {
      pending: pendingEmails.count,
      failed: failedEmails.count,
    },
    reminders: {
      pending: pendingReminders.count,
    },
    push_subscriptions: pushSubs.count,
    active_today: activeUsers.count,
  };
}

// ==================== Content Performance ====================

export function getContentPerformance(filters?: TimeRangeFilters) {
  const db = getDb();
  const tasks = TRAINING_TASKS as Array<{ id: string; title: string; difficulty: string; category?: string }>;

  const dateCondition = filters?.start_date && filters?.end_date
    ? `WHERE completed_at >= ${filters.start_date} AND completed_at <= ${filters.end_date}`
    : '';

  const taskStats = tasks.map(task => {
    const stat = db.prepare(`
      SELECT COUNT(*) as completions,
             AVG(attempts) as avg_attempts,
             CAST(SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) AS FLOAT) / MAX(COUNT(*), 1) * 100 as first_attempt_rate,
             COUNT(DISTINCT user_id) as unique_students
      FROM user_progress
      WHERE task_id = ? ${dateCondition ? `AND ${dateCondition.replace('WHERE ', '')}` : ''}
    `).get(task.id) as { completions: number; avg_attempts: number | null; first_attempt_rate: number | null; unique_students: number };

    const hintCount = db.prepare(`SELECT COUNT(*) as count FROM hint_usage WHERE task_id = ?`).get(task.id) as { count: number };

    return {
      task_id: task.id,
      task_title: task.title,
      difficulty: task.difficulty,
      category: task.category || 'general',
      completions: stat.completions,
      avg_attempts: stat.avg_attempts ? parseFloat(stat.avg_attempts.toFixed(2)) : 0,
      first_attempt_rate: stat.first_attempt_rate ? parseFloat(stat.first_attempt_rate.toFixed(1)) : 0,
      unique_students: stat.unique_students,
      hint_count: hintCount.count,
    };
  });

  const hardest = [...taskStats].sort((a, b) => b.avg_attempts - a.avg_attempts).slice(0, 10);
  const easiest = [...taskStats].sort((a, b) => b.first_attempt_rate - a.first_attempt_rate).reverse().slice(0, 10);
  const most_hints = [...taskStats].sort((a, b) => b.hint_count - a.hint_count).slice(0, 10);

  // Category aggregation
  const categoryMap = new Map<string, typeof taskStats>();
  for (const t of taskStats) {
    const catEntry = categoryMap.get(t.category);
    if (catEntry) {
      catEntry.push(t);
    } else {
      categoryMap.set(t.category, [t]);
    }
  }

  const byCategory = Array.from(categoryMap.entries()).map(([category, tasks]) => {
    const totalCompletions = tasks.reduce((s, t) => s + t.completions, 0);
    const totalHints = tasks.reduce((s, t) => s + t.hint_count, 0);
    const avgAttempts = tasks.length > 0 ? parseFloat((tasks.reduce((s, t) => s + t.avg_attempts, 0) / tasks.length).toFixed(2)) : 0;
    return { category, task_count: tasks.length, total_completions: totalCompletions, avg_attempts: avgAttempts, total_hints: totalHints };
  }).sort((a, b) => b.total_completions - a.total_completions);

  return {
    hardest_tasks: hardest,
    easiest_tasks: easiest,
    most_hinted_tasks: most_hints,
    by_category: byCategory,
  };
}

// ==================== Registration Funnel ====================

export function getRegistrationFunnel() {
  const db = getDb();

  const totalRegistered = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).get() as { count: number };

  // Users who completed at least 1 task
  const completedFirst = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_progress
  `).get() as { count: number };

  // Users who returned on day 2+
  const returnedDay2 = db.prepare(`
    SELECT COUNT(DISTINCT u.id) as count
    FROM users u
    INNER JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
      AND up.completed_at >= u.created_at + 86400000
  `).get() as { count: number };

  // Users who completed 5+ tasks (onboarding threshold)
  const completedOnboarding = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT user_id, COUNT(*) as task_count
      FROM user_progress
      GROUP BY user_id
      HAVING task_count >= 5
    )
  `).get() as { count: number };

  // Average time from registration to first activity
  const avgTimeToFirst = db.prepare(`
    SELECT AVG(first_activity - created_at) as avg_ms
    FROM (
      SELECT u.created_at, MIN(up.completed_at) as first_activity
      FROM users u
      INNER JOIN user_progress up ON u.id = up.user_id
      WHERE u.role = 'student'
      GROUP BY u.id
    )
  `).get() as { avg_ms: number | null };

  // Registrations by day (last 30 days)
  const dailyRegistrations = db.prepare(`
    SELECT STRFTIME('%Y-%m-%d', DATETIME(created_at / 1000, 'unixepoch')) as date,
           COUNT(*) as count
    FROM users
    WHERE role = 'student'
      AND created_at >= ?
    GROUP BY date
    ORDER BY date
  `).all(Date.now() - 30 * 24 * 60 * 60 * 1000) as Array<{ date: string; count: number }>;

  return {
    funnel: {
      total_registered: totalRegistered.count,
      completed_first_task: completedFirst.count,
      returned_day_2: returnedDay2.count,
      completed_onboarding: completedOnboarding.count,
      conversion_first: totalRegistered.count > 0 ? parseFloat(((completedFirst.count / totalRegistered.count) * 100).toFixed(1)) : 0,
      conversion_day2: completedFirst.count > 0 ? parseFloat(((returnedDay2.count / completedFirst.count) * 100).toFixed(1)) : 0,
      conversion_onboarding: returnedDay2.count > 0 ? parseFloat(((completedOnboarding.count / returnedDay2.count) * 100).toFixed(1)) : 0,
    },
    avg_time_to_first_activity_ms: avgTimeToFirst.avg_ms,
    dailyRegistrations,
  };
}

// ==================== Aggregate Performance ====================

export function getAggregatePerformance() {
  const db = getDb();

  // Student level distribution
  const allStudents = db.prepare(`
    SELECT u.id,
           COUNT(up.task_id) as tasks_completed,
           AVG(up.attempts) as avg_attempts
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id
  `).all() as Array<{ id: string; tasks_completed: number; avg_attempts: number | null }>;

  const levelDistribution = {
    beginner: allStudents.filter(s => s.tasks_completed < 5).length,
    intermediate: allStudents.filter(s => s.tasks_completed >= 5 && s.tasks_completed < 15).length,
    advanced: allStudents.filter(s => s.tasks_completed >= 15).length,
  };

  // Activity heatmap: hour of day × day of week
  const activityByHourDay = db.prepare(`
    SELECT CAST(STRFTIME('%w', DATETIME(completed_at / 1000, 'unixepoch')) AS INTEGER) as day_of_week,
           CAST(STRFTIME('%H', DATETIME(completed_at / 1000, 'unixepoch')) AS INTEGER) as hour,
           COUNT(*) as completions
    FROM user_progress
    GROUP BY day_of_week, hour
  `).all() as Array<{ day_of_week: number; hour: number; completions: number }>;

  const heatmapData: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const row of activityByHourDay) {
    heatmapData[row.day_of_week][row.hour] = row.completions;
  }

  // Weekly trend (last 12 weeks)
  const weeklyTrend = db.prepare(`
    SELECT STRFTIME('%Y-%W', DATETIME(completed_at / 1000, 'unixepoch')) as week,
           COUNT(*) as completions,
           COUNT(DISTINCT user_id) as unique_users
    FROM user_progress
    WHERE completed_at >= ?
    GROUP BY week
    ORDER BY week
  `).all(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000) as Array<{ week: string; completions: number; unique_users: number }>;

  // Correlation: attempts vs completion rate
  const correlationData = allStudents.slice(0, 100).map(s => ({
    tasks_completed: s.tasks_completed,
    avg_attempts: s.avg_attempts ? parseFloat(s.avg_attempts.toFixed(2)) : 0,
  }));

  return {
    level_distribution: levelDistribution,
    activity_heatmap: heatmapData,
    weekly_trend: weeklyTrend,
    correlation_data: correlationData,
  };
}

// ==================== Student Academic Performance ====================

/**
 * Identify students at risk of dropping out or failing.
 * Risk factors: low completion rate, no recent activity, high attempts, declining trend.
 */
export interface AtRiskStudent {
  user_id: string;
  name: string;
  email: string;
  completion_rate: number;
  days_since_active: number;
  avg_attempts: number;
  performance_trend: 'improving' | 'stable' | 'declining';
  risk_level: 'high' | 'medium' | 'low';
  risk_reasons: string[];
}

export function getAtRiskStudents(limit = 50): AtRiskStudent[] {
  const db = getDb();
  const now = Date.now();
  const totalTasks = TRAINING_TASKS.length;

  const students = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.email, u.created_at, u.last_active,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      MAX(up.completed_at) as last_completion
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email, u.created_at, u.last_active
    HAVING tasks_completed > 0
    ORDER BY tasks_completed ASC
    LIMIT ?
  `).all(limit) as Array<{
    user_id: string;
    name: string;
    email: string;
    created_at: number;
    last_active: number | null;
    tasks_completed: number;
    avg_attempts: number;
    last_completion: number | null;
  }>;

  const now30 = now - 30 * 24 * 60 * 60 * 1000;
  const now60 = now - 60 * 24 * 60 * 60 * 1000;

  return students.map(student => {
    const completionRate = Math.round((student.tasks_completed / totalTasks) * 100);
    const daysSinceActive = student.last_active ? Math.round((now - student.last_active) / (24 * 60 * 60 * 1000)) : 999;

    // Determine trend
    const recentCompletions = db.prepare(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed_at >= ?'
    ).get(student.user_id, now30) as { count: number };

    const prevCompletions = db.prepare(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed_at >= ? AND completed_at < ?'
    ).get(student.user_id, now60, now30) as { count: number };

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (prevCompletions.count > 0) {
      const change = ((recentCompletions.count - prevCompletions.count) / prevCompletions.count) * 100;
      trend = change > 20 ? 'improving' : change < -20 ? 'declining' : 'stable';
    } else if (recentCompletions.count > 0) {
      trend = 'improving';
    }

    // Determine risk reasons
    const reasons: string[] = [];
    if (completionRate < 25) reasons.push('low_completion');
    if (daysSinceActive >= 14) reasons.push('no_activity');
    if (student.avg_attempts > 3) reasons.push('high_attempts');
    if (trend === 'declining') reasons.push('declining');

    // Determine risk level
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (reasons.length >= 3 || (daysSinceActive >= 30 && completionRate < 15)) {
      riskLevel = 'high';
    } else if (reasons.length >= 2) {
      riskLevel = 'medium';
    } else if (reasons.length === 0) {
      return null; // Not at risk
    }

    return {
      user_id: student.user_id,
      name: student.name,
      email: student.email,
      completion_rate: completionRate,
      days_since_active: daysSinceActive,
      avg_attempts: student.avg_attempts,
      performance_trend: trend,
      risk_level: riskLevel,
      risk_reasons: reasons,
    };
  }).filter(Boolean) as AtRiskStudent[];
}

/**
 * Analyze skill gaps — per-student per-category completion rates.
 */
export interface SkillGapEntry {
  user_id: string;
  name: string;
  category: string;
  category_label: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  avg_attempts: number;
  is_weak: boolean;
}

export function getSkillGapAnalysis(limit = 30): SkillGapEntry[] {
  const db = getDb();

  const categories = [
    { key: 'company', label: 'Компания', prefixes: ['beginner-', 'intermediate-', 'advanced-'] },
    { key: 'analytics', label: 'Аналитика', prefixes: ['analytics-b-', 'analytics-i-', 'analytics-a-'] },
    { key: 'shop', label: 'Магазин', prefixes: ['shop-b-', 'shop-i-', 'shop-a-'] },
    { key: 'exam', label: 'Экзамен', prefixes: ['exam-b-', 'exam-i-', 'exam-a-'] },
  ];

  const activeCategories = categories.filter(cat =>
    TRAINING_TASKS.some(t => cat.prefixes.some(p => t.id.startsWith(p)))
  );

  const students = db.prepare(`
    SELECT u.id as user_id, u.name
    FROM users u
    WHERE u.role = 'student'
    AND EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = u.id)
    ORDER BY (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id) DESC
    LIMIT ?
  `).all(limit) as Array<{ user_id: string; name: string }>;

  const results: SkillGapEntry[] = [];

  for (const student of students) {
    for (const cat of activeCategories) {
      const taskIds = TRAINING_TASKS.filter(t => cat.prefixes.some(p => t.id.startsWith(p))).map(t => t.id);
      if (!taskIds.length) continue;

      const placeholders = taskIds.map(() => '?').join(',');

      const stats = db.prepare(`
        SELECT
          COUNT(DISTINCT up.task_id) as completed,
          ROUND(AVG(up.attempts * 1.0), 2) as avg_attempts
        FROM user_progress up
        WHERE up.user_id = ? AND up.task_id IN (${placeholders})
      `).get(student.user_id, ...taskIds) as { completed: number; avg_attempts: number };

      const completionRate = Math.round((stats.completed / taskIds.length) * 100);

      results.push({
        user_id: student.user_id,
        name: student.name,
        category: cat.key,
        category_label: cat.label,
        total_tasks: taskIds.length,
        completed_tasks: stats.completed,
        completion_rate: completionRate,
        avg_attempts: stats.avg_attempts,
        is_weak: completionRate < 50,
      });
    }
  }

  return results;
}

/**
 * Get academic timeline for a single student — milestones, achievements, completions.
 */
export interface TimelineEvent {
  event_type: string;
  event_label: string;
  timestamp: number;
  details?: string;
}

export function getAcademicTimeline(userId: string): TimelineEvent[] {
  const db = getDb();

  const events: TimelineEvent[] = [];

  // Registration
  const user = db.prepare(
    'SELECT created_at, name FROM users WHERE id = ?'
  ).get(userId) as { created_at: number; name: string } | undefined;

  if (user) {
    events.push({
      event_type: 'registration',
      event_label: 'registration',
      timestamp: user.created_at,
    });
  }

  // First task completion
  const firstTask = db.prepare(
    'SELECT task_id, completed_at FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC LIMIT 1'
  ).get(userId) as { task_id: string; completed_at: number } | undefined;

  if (firstTask) {
    const taskTitle = TRAINING_TASKS.find(t => t.id === firstTask.task_id)?.title || firstTask.task_id;
    events.push({
      event_type: 'first_task',
      event_label: 'first_task',
      timestamp: firstTask.completed_at,
      details: taskTitle,
    });
  }

  // Achievements
  const achievements = db.prepare(`
    SELECT ua.earned_at, a.title
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at ASC
  `).all(userId) as Array<{ earned_at: number; title: string }>;

  for (const a of achievements) {
    events.push({
      event_type: 'achievement',
      event_label: 'achievement',
      timestamp: a.earned_at,
      details: a.title,
    });
  }

  // Category completion milestones
  const categories = [
    { key: 'company', label: 'Компания', prefixes: ['beginner-', 'intermediate-', 'advanced-'] },
    { key: 'analytics', label: 'Аналитика', prefixes: ['analytics-b-', 'analytics-i-', 'analytics-a-'] },
    { key: 'shop', label: 'Магазин', prefixes: ['shop-b-', 'shop-i-', 'shop-a-'] },
    { key: 'exam', label: 'Экзамен', prefixes: ['exam-b-', 'exam-i-', 'exam-a-'] },
  ];

  for (const cat of categories) {
    const taskIds = TRAINING_TASKS.filter(t => cat.prefixes.some(p => t.id.startsWith(p))).map(t => t.id);
    if (!taskIds.length) continue;

    const placeholders = taskIds.map(() => '?').join(',');

    const firstInCategory = db.prepare(`
      SELECT completed_at FROM user_progress
      WHERE user_id = ? AND task_id IN (${placeholders})
      ORDER BY completed_at ASC LIMIT 1
    `).get(userId, ...taskIds) as { completed_at: number } | undefined;

    if (firstInCategory) {
      events.push({
        event_type: 'category_started',
        event_label: 'category_started',
        timestamp: firstInCategory.completed_at,
        details: cat.label,
      });
    }
  }

  // Sort by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);

  return events;
}

/**
 * Analyze study patterns — session frequency, time-of-day preferences, consistency.
 */
export interface StudyPatternSummary {
  avg_sessions_per_week: number;
  preferred_hour: number;
  preferred_day: string;
  consistency_score: number;
  hourly_distribution: Array<{ hour: number; sessions: number }>;
  weekly_distribution: Array<{ day: string; sessions: number }>;
  day_hour_heatmap: number[][];
  student_count: number;
}

export function getStudyPatterns(): StudyPatternSummary {
  const db = getDb();

  // Derive sessions: group completions within 30-min windows per user
  // For simplicity, count each completion as a data point for hour/day distribution
  const hourlyData = db.prepare(`
    SELECT CAST(STRFTIME('%H', DATETIME(completed_at / 1000, 'unixepoch')) AS INTEGER) as hour,
           COUNT(*) as sessions
    FROM user_progress
    GROUP BY hour
    ORDER BY hour
  `).all() as Array<{ hour: number; sessions: number }>;

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dayData = db.prepare(`
    SELECT CAST(STRFTIME('%w', DATETIME(completed_at / 1000, 'unixepoch')) AS INTEGER) as day,
           COUNT(*) as sessions
    FROM user_progress
    GROUP BY day
    ORDER BY day
  `).all() as Array<{ day: number; sessions: number }>;

  // Day-hour heatmap
  const heatmapData = db.prepare(`
    SELECT CAST(STRFTIME('%w', DATETIME(completed_at / 1000, 'unixepoch')) AS INTEGER) as day,
           CAST(STRFTIME('%H', DATETIME(completed_at / 1000, 'unixepoch')) AS INTEGER) as hour,
           COUNT(*) as completions
    FROM user_progress
    GROUP BY day, hour
    ORDER BY day, hour
  `).all() as Array<{ day: number; hour: number; completions: number }>;

  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const row of heatmapData) {
    heatmap[row.day][row.hour] = row.completions;
  }

  // Fill in missing hours/days
  const hourMap = new Map(hourlyData.map(d => [d.hour, d.sessions]));
  const dayMap = new Map(dayData.map(d => [d.day, d.sessions]));

  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sessions: hourMap.get(i) || 0,
  }));

  const weeklyDistribution = dayNames.map((name, i) => ({
    day: name,
    sessions: dayMap.get(i) || 0,
  }));

  // Preferred hour and day
  const preferredHour = hourlyData.reduce((max, d) => d.sessions > (max.sessions || 0) ? d : max, hourlyData[0] || { hour: 9, sessions: 0 });
  const preferredDayData = dayData.reduce((max, d) => d.sessions > (max.sessions || 0) ? d : max, dayData[0] || { day: 1, sessions: 0 });

  // Consistency score: std deviation of weekly session counts (lower = more consistent)
  const weeklySessionCounts = db.prepare(`
    SELECT STRFTIME('%Y-%W', DATETIME(completed_at / 1000, 'unixepoch')) as week,
           COUNT(*) as count
    FROM user_progress
    GROUP BY week
    ORDER BY week
  `).all() as Array<{ week: string; count: number }>;

  let consistencyScore = 0;
  if (weeklySessionCounts.length > 1) {
    const counts = weeklySessionCounts.map(w => w.count);
    const avg = counts.reduce((s, c) => s + c, 0) / counts.length;
    const variance = counts.reduce((s, c) => s + (c - avg) ** 2, 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    // Normalize: 0 = very inconsistent, 100 = very consistent
    consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (stdDev / (avg || 1)) * 50)));
  }

  // Avg sessions per week
  const avgSessionsPerWeek = weeklySessionCounts.length > 0
    ? Math.round(weeklySessionCounts.reduce((s, w) => s + w.count, 0) / weeklySessionCounts.length * 10) / 10
    : 0;

  const studentCount = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number };

  return {
    avg_sessions_per_week: avgSessionsPerWeek,
    preferred_hour: preferredHour.hour,
    preferred_day: dayNames[preferredDayData.day] || 'Пн',
    consistency_score: consistencyScore,
    hourly_distribution: hourlyDistribution,
    weekly_distribution: weeklyDistribution,
    day_hour_heatmap: heatmap,
    student_count: studentCount.count,
  };
}

/**
 * Track attempt efficiency trends — how first-attempt rate changes over time.
 */
export interface AttemptEfficiencyEntry {
  week_label: string;
  first_attempt_rate: number;
  avg_attempts: number;
  total_completions: number;
}

export function getAttemptEfficiencyTrends(weeks = 12): AttemptEfficiencyEntry[] {
  const db = getDb();
  const cutoff = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;

  const weeklyData = db.prepare(`
    SELECT STRFTIME('%Y-%W', DATETIME(completed_at / 1000, 'unixepoch')) as week,
           COUNT(*) as total_completions,
           ROUND(AVG(CASE WHEN attempts = 1 THEN 1.0 ELSE 0.0 END) * 100, 1) as first_attempt_rate,
           ROUND(AVG(attempts * 1.0), 2) as avg_attempts
    FROM user_progress
    WHERE completed_at >= ?
    GROUP BY week
    ORDER BY week
  `).all(cutoff) as Array<{ week: string; total_completions: number; first_attempt_rate: number; avg_attempts: number }>;

  return weeklyData.map(d => ({
    week_label: d.week,
    first_attempt_rate: d.first_attempt_rate,
    avg_attempts: d.avg_attempts,
    total_completions: d.total_completions,
  }));
}

/**
 * Get comparison metrics for multiple students (2-4).
 */
export interface StudentComparisonMetrics {
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  completion_rate: number;
  avg_attempts: number;
  streak: number;
  achievements: number;
  beginner_completed: number;
  intermediate_completed: number;
  advanced_completed: number;
  category_completion: Array<{ category: string; rate: number }>;
  sessions_per_week: number;
  consistency_score: number;
}

export function getStudentComparisonMetrics(studentIds: string[]): StudentComparisonMetrics[] {
  const db = getDb();
  const totalTasks = TRAINING_TASKS.length;

  if (studentIds.length === 0) return [];

  const placeholders = studentIds.map(() => '?').join(',');

  const students = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.email,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'beginner-%' THEN 1 ELSE 0 END), 0) as beginner_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'intermediate-%' THEN 1 ELSE 0 END), 0) as intermediate_completed,
      COALESCE(SUM(CASE WHEN up.task_id LIKE 'advanced-%' THEN 1 ELSE 0 END), 0) as advanced_completed,
      (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements,
      u.streak_current as streak
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.id IN (${placeholders})
    GROUP BY u.id, u.name, u.email, u.streak_current
  `).all(...studentIds) as Array<{
    user_id: string;
    name: string;
    email: string;
    tasks_completed: number;
    avg_attempts: number;
    beginner_completed: number;
    intermediate_completed: number;
    advanced_completed: number;
    achievements: number;
    streak: number;
  }>;

  const categories = [
    { key: 'company', prefixes: ['beginner-', 'intermediate-', 'advanced-'] },
    { key: 'analytics', prefixes: ['analytics-b-', 'analytics-i-', 'analytics-a-'] },
    { key: 'shop', prefixes: ['shop-b-', 'shop-i-', 'shop-a-'] },
    { key: 'exam', prefixes: ['exam-b-', 'exam-i-', 'exam-a-'] },
  ];

  return students.map(student => {
    const completionRate = Math.round((student.tasks_completed / totalTasks) * 100);

    // Category completion rates
    const categoryCompletion = categories.map(cat => {
      const taskIds = TRAINING_TASKS.filter(t => cat.prefixes.some(p => t.id.startsWith(p))).map(t => t.id);
      if (!taskIds.length) return { category: cat.key, rate: 0 };
      const completed = db.prepare(`
        SELECT COUNT(DISTINCT task_id) as count FROM user_progress
        WHERE user_id = ? AND task_id IN (${taskIds.map(() => '?').join(',')})
      `).get(student.user_id, ...taskIds) as { count: number };
      return { category: cat.key, rate: Math.round((completed.count / taskIds.length) * 100) };
    });

    // Sessions per week estimate
    const firstCompletionRow = db.prepare(
      'SELECT MIN(completed_at) as min_date FROM user_progress WHERE user_id = ?'
    ).get(student.user_id) as { min_date: number } | undefined;
    const firstCompletionDate = firstCompletionRow?.min_date || Date.now();
    const weeksActive = Math.max(1, Math.round((Date.now() - firstCompletionDate) / (7 * 24 * 60 * 60 * 1000)));
    const sessionsPerWeek = Math.round((student.tasks_completed / weeksActive) * 10) / 10;

    // Consistency score (simplified)
    const consistencyScore = Math.min(100, Math.round((student.streak / Math.max(1, weeksActive)) * 100));

    return {
      user_id: student.user_id,
      name: student.name,
      email: student.email,
      tasks_completed: student.tasks_completed,
      completion_rate: completionRate,
      avg_attempts: student.avg_attempts,
      streak: student.streak,
      achievements: student.achievements,
      beginner_completed: student.beginner_completed,
      intermediate_completed: student.intermediate_completed,
      advanced_completed: student.advanced_completed,
      category_completion: categoryCompletion,
      sessions_per_week: sessionsPerWeek,
      consistency_score: consistencyScore,
    };
  });
}

/**
 * Get comprehensive academic summary for a single student.
 */
export interface StudentAcademicSummary {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: number;
  last_active: number | null;
  tasks_completed: number;
  total_tasks: number;
  completion_rate: number;
  avg_attempts: number;
  total_attempts: number;
  streak_current: number;
  streak_longest: number;
  achievements: Array<{ title: string; earned_at: number }>;
  skill_breakdown: Array<{ category: string; label: string; completed: number; total: number; rate: number; avg_attempts: number }>;
  recent_activity: Array<{ task_id: string; task_title: string; completed_at: number; attempts: number }>;
  performance_trend: 'improving' | 'stable' | 'declining';
  at_risk_flags: string[];
  recommendations: string[];
}

export function getStudentAcademicSummary(userId: string): StudentAcademicSummary | null {
  const db = getDb();
  const totalTasks = TRAINING_TASKS.length;

  const user = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.role, u.created_at, u.last_active,
      u.streak_current, u.streak_longest,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(SUM(up.attempts), 0) as total_attempts,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.last_active, u.streak_current, u.streak_longest
  `).get(userId) as {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: number;
    last_active: number | null;
    streak_current: number;
    streak_longest: number;
    tasks_completed: number;
    total_attempts: number;
    avg_attempts: number;
  } | undefined;

  if (!user) return null;

  const completionRate = Math.round((user.tasks_completed / totalTasks) * 100);

  // Achievements
  const achievements = db.prepare(`
    SELECT a.title, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at DESC
    LIMIT 10
  `).all(userId) as Array<{ title: string; earned_at: number }>;

  // Skill breakdown
  const categories = [
    { key: 'company', label: 'Компания', prefixes: ['beginner-', 'intermediate-', 'advanced-'] },
    { key: 'analytics', label: 'Аналитика', prefixes: ['analytics-b-', 'analytics-i-', 'analytics-a-'] },
    { key: 'shop', label: 'Магазин', prefixes: ['shop-b-', 'shop-i-', 'shop-a-'] },
    { key: 'exam', label: 'Экзамен', prefixes: ['exam-b-', 'exam-i-', 'exam-a-'] },
  ];

  const skillBreakdown = categories.map(cat => {
    const taskIds = TRAINING_TASKS.filter(t => cat.prefixes.some(p => t.id.startsWith(p))).map(t => t.id);
    if (!taskIds.length) return { category: cat.key, label: cat.label, completed: 0, total: 0, rate: 0, avg_attempts: 0 };
    const placeholders = taskIds.map(() => '?').join(',');
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT up.task_id) as completed,
        ROUND(AVG(up.attempts * 1.0), 2) as avg_attempts
      FROM user_progress up
      WHERE up.user_id = ? AND up.task_id IN (${placeholders})
    `).get(userId, ...taskIds) as { completed: number; avg_attempts: number };
    return {
      category: cat.key,
      label: cat.label,
      completed: stats.completed,
      total: taskIds.length,
      rate: Math.round((stats.completed / taskIds.length) * 100),
      avg_attempts: stats.avg_attempts,
    };
  });

  // Recent activity
  const recentActivity = db.prepare(`
    SELECT up.task_id, up.completed_at, up.attempts
    FROM user_progress up
    WHERE up.user_id = ?
    ORDER BY up.completed_at DESC
    LIMIT 10
  `).all(userId) as Array<{ task_id: string; completed_at: number; attempts: number }>;

  const recentWithTitles = recentActivity.map(a => ({
    ...a,
    task_title: TRAINING_TASKS.find(t => t.id === a.task_id)?.title || a.task_id,
  }));

  // Performance trend
  const now30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const now60 = Date.now() - 60 * 24 * 60 * 60 * 1000;

  const recentCount = db.prepare(
    'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed_at >= ?'
  ).get(userId, now30) as { count: number };

  const prevCount = db.prepare(
    'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed_at >= ? AND completed_at < ?'
  ).get(userId, now60, now30) as { count: number };

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (prevCount.count > 0) {
    const change = ((recentCount.count - prevCount.count) / prevCount.count) * 100;
    trend = change > 20 ? 'improving' : change < -20 ? 'declining' : 'stable';
  } else if (recentCount.count > 0) {
    trend = 'improving';
  }

  // At-risk flags
  const atRiskFlags: string[] = [];
  const daysSinceActive = user.last_active ? Math.round((Date.now() - user.last_active) / (24 * 60 * 60 * 1000)) : 999;
  if (completionRate < 25) atRiskFlags.push('low_completion');
  if (daysSinceActive >= 14) atRiskFlags.push('inactive');
  if (user.avg_attempts > 3) atRiskFlags.push('high_attempts');
  if (trend === 'declining') atRiskFlags.push('declining_trend');

  // Recommendations
  const recommendations: string[] = [];
  if (completionRate < 50) recommendations.push('increase_practice');
  if (user.avg_attempts > 3) recommendations.push('review_fundamentals');
  const weakestSkill = skillBreakdown.filter(s => s.total > 0).sort((a, b) => a.rate - b.rate)[0];
  if (weakestSkill && weakestSkill.rate < 50) {
    recommendations.push(`focus_on_${weakestSkill.category}`);
  }
  if (user.streak_current === 0) recommendations.push('build_streak');
  if (trend === 'declining') recommendations.push('re_engage');

  return {
    user_id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    last_active: user.last_active,
    tasks_completed: user.tasks_completed,
    total_tasks: totalTasks,
    completion_rate: completionRate,
    avg_attempts: user.avg_attempts,
    total_attempts: user.total_attempts,
    streak_current: user.streak_current,
    streak_longest: user.streak_longest,
    achievements,
    skill_breakdown: skillBreakdown,
    recent_activity: recentWithTitles,
    performance_trend: trend,
    at_risk_flags: atRiskFlags,
    recommendations,
  };
}

// ==================== End Student Academic Performance ====================

// ==================== End Expanded Analytics ====================

// Initialize on import
initDatabase();

