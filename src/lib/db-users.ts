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
    GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_active
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
  const totalTasks = 56;
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
  const progress = db.prepare(
    'SELECT attempts FROM user_progress WHERE user_id = ? ORDER BY completed_at ASC'
  ).all(userId) as { attempts: number }[];

  let maxStreak = 0;
  let currentStreak = 0;
  for (const row of progress) {
    if (row.attempts === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return maxStreak;
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

export function getTaskAnalytics(): TaskAnalyticsEntry[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      task_id,
      COUNT(*) as completions,
      ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
      ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
    FROM user_progress
    GROUP BY task_id
    ORDER BY avg_attempts DESC
  `).all() as TaskAnalyticsEntry[];
}

export interface CompletionBucket {
  range: string;
  min: number;
  max: number;
  student_count: number;
}

export function getCompletionDistribution(): CompletionBucket[] {
  const db = getDb();
  const buckets = [
    { range: '0-5', min: 0, max: 5 },
    { range: '6-10', min: 6, max: 10 },
    { range: '11-20', min: 11, max: 20 },
    { range: '21-35', min: 21, max: 35 },
    { range: '36-56', min: 36, max: 56 },
  ];

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
      WHERE u.role = 'student'
      GROUP BY u.id
    )
    GROUP BY range_label
  `).all() as { range_label: string; student_count: number }[];

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

export function getAchievementStats(): AchievementStatsEntry[] {
  const db = getDb();
  const totalStudents = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number };

  const achievements = db.prepare(`
    SELECT a.id, a.title, a.description, a.icon,
           COUNT(ua.user_id) as earned_count
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
    GROUP BY a.id, a.title, a.description, a.icon
    ORDER BY a.id
  `).all() as {
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

export function getDailyActivity(days = 30): DailyActivityEntry[] {
  const db = getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const rows = db.prepare(`
    SELECT
      date(completed_at / 1000, 'unixepoch') as day,
      COUNT(*) as completions,
      COUNT(DISTINCT user_id) as unique_users
    FROM user_progress
    WHERE completed_at >= ?
    GROUP BY day
    ORDER BY day
  `).all(cutoff) as { day: string; completions: number; unique_users: number }[];

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

export function getAdminLeaderboard(limit = 50): AdminLeaderboardEntry[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.email,
      COUNT(up.task_id) as tasks_completed,
      COALESCE(SUM(up.attempts), 0) as total_attempts,
      COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
      (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email
    ORDER BY tasks_completed DESC, total_attempts ASC
    LIMIT ?
  `).all(limit) as {
    user_id: string;
    name: string;
    email: string;
    tasks_completed: number;
    total_attempts: number;
    avg_attempts: number;
    achievements_count: number;
  }[];

  const totalTasks = 56;
  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    completion_rate: Math.round((r.tasks_completed / totalTasks) * 1000) / 10,
  }));
}

export function getActiveUsersCount(days = 7): number {
  const db = getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const row = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_progress
    WHERE completed_at >= ?
  `).get(cutoff) as { count: number };
  return row.count;
}

export function getAvgAttemptsPerTask(): number {
  const db = getDb();
  const row = db.prepare(
    'SELECT ROUND(AVG(attempts * 1.0), 2) as avg FROM user_progress'
  ).get() as { avg: number };
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

export function getCohortAnalysis(): CohortEntry[] {
  const db = getDb();

  // Get students grouped by registration month
  const cohorts = db.prepare(`
    SELECT
      strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as cohort_month,
      COUNT(DISTINCT id) as total_students
    FROM users
    WHERE role = 'student'
    GROUP BY cohort_month
    ORDER BY cohort_month
  `).all() as { cohort_month: string; total_students: number }[];

  // For each cohort, calculate retention by month
  return cohorts.map(cohort => {
    const monthOffsets = [0, 1, 2, 3];
    const retention = monthOffsets.map(offset => {
      const row = db.prepare(`
        SELECT COUNT(DISTINCT up.user_id) as active_students
        FROM users u
        JOIN user_progress up ON u.id = up.user_id
        WHERE u.role = 'student'
          AND strftime('%Y-%m', datetime(u.created_at / 1000, 'unixepoch')) = ?
          AND strftime('%Y-%m', datetime(up.completed_at / 1000, 'unixepoch')) = 
              strftime('%Y-%m', datetime(u.created_at / 1000, 'unixepoch', ?))
      `).get(cohort.cohort_month, `+${offset} months`) as { active_students: number };

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

export function getStudentPerformanceCards(limit = 20): StudentPerformanceCard[] {
  const db = getDb();

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
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.email, u.created_at
    ORDER BY tasks_completed DESC
    LIMIT ?
  `).all(limit) as {
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

  const totalTasks = 56;

  return students.map(student => {
    // Calculate performance trend based on last 30 days vs previous 30 days
    const now = Date.now();
    const recent = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_progress
      WHERE user_id = ? AND completed_at >= ?
    `).get(student.user_id, now - 30 * 24 * 60 * 60 * 1000) as { count: number };

    const previous = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_progress
      WHERE user_id = ? AND completed_at >= ? AND completed_at < ?
    `).get(student.user_id, now - 60 * 24 * 60 * 60 * 1000, now - 30 * 24 * 60 * 60 * 1000) as { count: number };

    let performance_trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recent.count > previous.count * 1.2) performance_trend = 'improving';
    else if (recent.count < previous.count * 0.8) performance_trend = 'declining';

    // Determine weakest difficulty
    let weakest_difficulty = 'beginner';
    const rates = [
      student.beginner_completed / 8,
      student.intermediate_completed / 15,
      student.advanced_completed / 25,
    ];
    const minRate = Math.min(...rates);
    if (minRate === rates[2]) weakest_difficulty = 'advanced';
    else if (minRate === rates[1]) weakest_difficulty = 'intermediate';

    return {
      ...student,
      completion_rate: Math.round((student.tasks_completed / totalTasks) * 1000) / 10,
      performance_trend,
      streak: getStudentStreak(student.user_id),
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

export function getDifficultyComparison(): DifficultyComparisonEntry[] {
  const db = getDb();
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const totalTasksByDifficulty: Record<string, number> = {
    beginner: 8,
    intermediate: 15,
    advanced: 25,
  };

  return difficulties.map(difficulty => {
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as total_students_attempted,
        COUNT(*) as total_completions,
        ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
        ROUND(100.0 * SUM(CASE WHEN attempts = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as first_attempt_rate
      FROM user_progress
      WHERE task_id LIKE '${difficulty}-%'
    `).get() as {
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

export function generateStudentAlerts(): StudentAlert[] {
  const db = getDb();
  const alerts: StudentAlert[] = [];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const students = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at
    FROM users u
    WHERE u.role = 'student'
  `).all() as { id: string; name: string; email: string; created_at: number }[];

  for (const student of students) {
    // Check if student is inactive (no activity in 7 days)
    const lastActivity = db.prepare(`
      SELECT MAX(completed_at) as last_active
      FROM user_progress
      WHERE user_id = ?
    `).get(student.id) as { last_active: number | null };

    if (lastActivity.last_active && lastActivity.last_active < sevenDaysAgo) {
      const daysInactive = Math.floor((now - lastActivity.last_active) / (24 * 60 * 60 * 1000));
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'inactive',
        severity: daysInactive > 14 ? 'high' : 'medium',
        message: `Неактивен ${daysInactive} дней`,
        created_at: now,
        metadata: { daysInactive, lastActive: lastActivity.last_active },
      });
    }

    // Check if student is struggling (high avg attempts)
    const progress = db.prepare(`
      SELECT 
        COUNT(*) as tasks_completed,
        ROUND(AVG(attempts * 1.0), 2) as avg_attempts
      FROM user_progress
      WHERE user_id = ?
    `).get(student.id) as { tasks_completed: number; avg_attempts: number };

    if (progress.tasks_completed >= 3 && progress.avg_attempts > 3) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'struggling',
        severity: progress.avg_attempts > 5 ? 'high' : 'medium',
        message: `Высокое число попыток (ср. ${progress.avg_attempts})`,
        created_at: now,
        metadata: { tasksCompleted: progress.tasks_completed, avgAttempts: progress.avg_attempts },
      });
    }

    // Check if student is at risk (low completion rate after 30 days)
    const daysSinceRegistration = Math.floor((now - student.created_at) / (24 * 60 * 60 * 1000));
    if (daysSinceRegistration >= 30 && progress.tasks_completed < 5) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'at_risk',
        severity: 'high',
        message: `Критически низкий прогресс (${progress.tasks_completed}/56 заданий)`,
        created_at: now,
        metadata: { daysSinceRegistration, tasksCompleted: progress.tasks_completed },
      });
    }

    // Check if student is excelling (completed > 80% with low attempts)
    const completionRate = progress.tasks_completed / 56;
    if (completionRate > 0.8 && progress.avg_attempts < 2) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'excelling',
        severity: 'low',
        message: `Отличная успеваемость (${progress.tasks_completed}/56, ср. ${progress.avg_attempts} попыток)`,
        created_at: now,
        metadata: { tasksCompleted: progress.tasks_completed, avgAttempts: progress.avg_attempts },
      });
    }

    // Check milestones
    if (progress.tasks_completed === 10 || progress.tasks_completed === 25 || progress.tasks_completed === 50) {
      alerts.push({
        user_id: student.id,
        name: student.name,
        email: student.email,
        alert_type: 'milestone',
        severity: 'low',
        message: `Достигнута веха: ${progress.tasks_completed} заданий выполнено`,
        created_at: now,
        metadata: { tasksCompleted: progress.tasks_completed },
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

export function generateRecommendations(): Recommendation[] {
  const db = getDb();
  const recommendations: Recommendation[] = [];

  const students = db.prepare(`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'student'
  `).all() as { id: string; name: string; email: string }[];

  for (const student of students) {
    const progress = db.prepare(`
      SELECT 
        COUNT(*) as tasks_completed,
        ROUND(AVG(attempts * 1.0), 2) as avg_attempts,
        SUM(CASE WHEN task_id LIKE 'beginner-%' THEN 1 ELSE 0 END) as beginner_completed,
        SUM(CASE WHEN task_id LIKE 'intermediate-%' THEN 1 ELSE 0 END) as intermediate_completed,
        SUM(CASE WHEN task_id LIKE 'advanced-%' THEN 1 ELSE 0 END) as advanced_completed
      FROM user_progress
      WHERE user_id = ?
    `).get(student.id) as {
      tasks_completed: number;
      avg_attempts: number;
      beginner_completed: number;
      intermediate_completed: number;
      advanced_completed: number;
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

export function generateClassReport(): ClassReport {
  const db = getDb();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalStudents = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  ).get() as { count: number };

  const activeStudents = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_progress
    WHERE completed_at >= ?
  `).get(sevenDaysAgo) as { count: number };

  const allStudents = db.prepare(`
    SELECT 
      u.name,
      COUNT(up.task_id) as tasks_completed,
      ROUND(AVG(up.attempts * 1.0), 2) as avg_attempts,
      MAX(up.completed_at) as last_active
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name
  `).all() as {
    name: string;
    tasks_completed: number;
    avg_attempts: number;
    last_active: number | null;
  }[];

  const totalTasks = 56;
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

export function getErrorPatternAnalysis(): ErrorPatternEntry[] {
  const db = getDb();

  const taskAttempts = db.prepare(`
    SELECT 
      up.task_id,
      COUNT(*) as students_attempted,
      ROUND(AVG(up.attempts * 1.0), 2) as avg_attempts,
      MAX(up.attempts) as max_attempts,
      SUM(CASE WHEN up.attempts > 3 THEN 1 ELSE 0 END) as high_attempt_count
    FROM user_progress up
    GROUP BY up.task_id
    ORDER BY avg_attempts DESC
  `).all() as Array<{
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

export function getTimeToCompleteEstimates(): TimeToCompleteEntry[] {
  const db = getDb();

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
         WHERE up2.user_id = up.user_id AND up2.completed_at <= up.completed_at) as position
      FROM user_progress
    ) subquery ON up.user_id = subquery.user_id AND up.task_id = subquery.task_id
    GROUP BY up.task_id
    ORDER BY avg_position ASC
  `).all() as Array<{ task_id: string; avg_position: number }>;

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

    if (entryMap.has(dateStr)) {
      result.push(entryMap.get(dateStr)!);
    } else {
      result.push({ date: dateStr, completions: 0, day_of_week: dayOfWeek, week_number: weekNum });
    }
  }

  return result;
}

export function getStudentEngagementMetrics(limit: number = 50): EngagementMetric[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const students = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.tasks_completed, u.last_active, u.created_at,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id) as total_progress,
      (SELECT AVG(attempts) FROM user_progress WHERE user_id = u.id) as avg_attempts
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.tasks_completed DESC
    LIMIT ?
  `).all(limit) as Array<{
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
    const completionRate = Math.min((student.tasks_completed / 56) * 100, 100);
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

export function getChurnPredictions(limit: number = 50): ChurnPrediction[] {
  const db = getDb();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const students = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.tasks_completed, u.last_active, u.created_at,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id) as total_progress,
      (SELECT AVG(attempts) FROM user_progress WHERE user_id = u.id) as avg_attempts,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed_at > ?) as recent_completions,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed_at > ? AND completed_at <= ?) as previous_completions
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.tasks_completed ASC
    LIMIT ?
  `).all(now - 14 * dayMs, now - 28 * dayMs, now - 14 * dayMs, limit) as Array<{
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

    const completionRate = Math.min((student.tasks_completed / 56) * 100, 100);
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

export function getWeekOverWeekComparison(): WeekOverWeekEntry[] {
  const db = getDb();
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const currentWeekStart = now - weekMs;
  const previousWeekStart = now - 2 * weekMs;

  // Completions: current vs previous week
  const currentCompletions = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?
  `).get(currentWeekStart) as { count: number };

  const previousCompletions = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?
  `).get(previousWeekStart, currentWeekStart) as { count: number };

  // Active users: current vs previous week
  const currentActive = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?
  `).get(currentWeekStart) as { count: number };

  const previousActive = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?
  `).get(previousWeekStart, currentWeekStart) as { count: number };

  // Avg attempts: current vs previous week
  const currentAttempts = db.prepare(`
    SELECT COALESCE(ROUND(AVG(attempts * 1.0), 2), 0) as avg_val FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ?
  `).get(currentWeekStart) as { avg_val: number };

  const previousAttempts = db.prepare(`
    SELECT COALESCE(ROUND(AVG(attempts * 1.0), 2), 0) as avg_val FROM user_progress
    WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?
  `).get(previousWeekStart, currentWeekStart) as { avg_val: number };

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

// Initialize on import
initDatabase();

