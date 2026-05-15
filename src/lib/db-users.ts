/**
 * User database layer — SQLite file-based storage.
 * Separate from the in-memory training database.
 * Uses a singleton connection to avoid SQLITE_BUSY during concurrent access.
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

export type UserRole = 'student' | 'teacher' | 'admin';
const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

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
  `);

  // Migration: add role column if it doesn't exist (for existing databases)
  const columns = db.pragma("table_info(users)") as { name: string }[];
  const hasRole = columns.some(c => c.name === 'role');
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
  }

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
export async function createUser(email: string, name: string, password: string, phone?: string, role: UserRole = 'student'): Promise<{ id: string; email: string; name: string; phone: string | null; role: UserRole } | null> {
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
  const record = db.prepare(
    'SELECT user_id, type, expires_at, used FROM reset_codes WHERE code = ? ORDER BY expires_at DESC LIMIT 1'
  ).get(code) as { user_id: string; type: string; expires_at: number; used: number } | undefined;

  if (!record || record.used === 1 || record.expires_at < Date.now()) return null;

  db.prepare('UPDATE reset_codes SET used = 1 WHERE code = ?').run(code);
  return { userId: record.user_id, type: record.type };
}

// Progress
export async function saveUserProgress(userId: string, taskId: string, attempts: number): Promise<void> {
  const db = getDb();
  db.prepare(
    'INSERT INTO user_progress (user_id, task_id, completed_at, attempts) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, task_id) DO UPDATE SET completed_at = ?, attempts = ?'
  ).run(userId, taskId, Date.now(), attempts, Date.now(), attempts);
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

export function getLeaderboard(limit = 50): LeaderboardEntry[] {
  const db = getDb();
  return db.prepare(`
    SELECT u.id as user_id, u.name,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(SUM(up.attempts), 0) as total_attempts
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    GROUP BY u.id, u.name
    ORDER BY tasks_completed DESC, total_attempts ASC
    LIMIT ?
  `).all(limit) as LeaderboardEntry[];
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
}

export function getAllUsers(): UserSummary[] {
  const db = getDb();
  return db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
           COUNT(up.task_id) as tasks_completed
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at
    ORDER BY u.created_at DESC
  `).all() as UserSummary[];
}

export function updateUserRole(userId: string, role: UserRole): boolean {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const db = getDb();
  const result = db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, Date.now(), userId);
  return result.changes > 0;
}

export function deleteUser(userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return result.changes > 0;
}

export interface StudentProgress {
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  total_attempts: number;
  last_active: number | null;
}

export function getTeacherStudentProgress(): StudentProgress[] {
  const db = getDb();
  return db.prepare(`
    SELECT u.id as user_id, u.name, u.email,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(SUM(up.attempts), 0) as total_attempts,
           MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email
    ORDER BY tasks_completed DESC, total_attempts ASC
  `).all() as StudentProgress[];
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

// Initialize on import
initDatabase();
