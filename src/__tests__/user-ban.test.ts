import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';

// Create an in-memory test database with the ban schema
function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER DEFAULT NULL,
      banned_at INTEGER DEFAULT NULL,
      ban_reason TEXT DEFAULT NULL,
      banned_by TEXT DEFAULT NULL,
      last_active INTEGER,
      role_changed_at INTEGER DEFAULT NULL,
      streak_current INTEGER NOT NULL DEFAULT 0,
      streak_longest INTEGER NOT NULL DEFAULT 0,
      last_practice_date INTEGER
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
  `);
  return db;
}

describe('User Ban/Unban', () => {
  let db: Database.Database;
  const adminId = 'admin-001';
  const studentId = 'student-001';
  const now = Date.now();

  beforeEach(() => {
    db = createTestDb();

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(adminId, 'admin@test.com', 'Admin', '$2b$12$hash', 'admin', now, now);

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(studentId, 'student@test.com', 'Student', '$2b$12$hash', 'student', now, now);
  });

  describe('Ban user', () => {
    it('should set banned_at, ban_reason, banned_by', () => {
      const result = db.prepare(
        'UPDATE users SET banned_at = ?, ban_reason = ?, banned_by = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL'
      ).run(now, 'Spam', adminId, now, studentId);

      expect(result.changes).toBe(1);

      const user = db.prepare('SELECT banned_at, ban_reason, banned_by FROM users WHERE id = ?').get(studentId) as {
        banned_at: number; ban_reason: string; banned_by: string;
      };
      expect(user.banned_at).toBe(now);
      expect(user.ban_reason).toBe('Spam');
      expect(user.banned_by).toBe(adminId);
    });

    it('should not ban already deleted users', () => {
      db.prepare('UPDATE users SET deleted_at = ? WHERE id = ?').run(now, studentId);

      const result = db.prepare(
        'UPDATE users SET banned_at = ?, ban_reason = ?, banned_by = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL'
      ).run(now, 'Spam', adminId, now, studentId);

      expect(result.changes).toBe(0);
    });
  });

  describe('Unban user', () => {
    it('should clear banned_at, ban_reason, banned_by', () => {
      // First ban
      db.prepare(
        'UPDATE users SET banned_at = ?, ban_reason = ?, banned_by = ?, updated_at = ? WHERE id = ?'
      ).run(now, 'Spam', adminId, now, studentId);

      // Then unban
      const result = db.prepare(
        'UPDATE users SET banned_at = NULL, ban_reason = NULL, banned_by = NULL, updated_at = ? WHERE id = ? AND banned_at IS NOT NULL'
      ).run(Date.now(), studentId);

      expect(result.changes).toBe(1);

      const user = db.prepare('SELECT banned_at, ban_reason, banned_by FROM users WHERE id = ?').get(studentId) as {
        banned_at: number | null; ban_reason: string | null; banned_by: string | null;
      };
      expect(user.banned_at).toBeNull();
      expect(user.ban_reason).toBeNull();
      expect(user.banned_by).toBeNull();
    });

    it('should not unban already unbanned users', () => {
      const result = db.prepare(
        'UPDATE users SET banned_at = NULL, ban_reason = NULL, banned_by = NULL, updated_at = ? WHERE id = ? AND banned_at IS NOT NULL'
      ).run(Date.now(), studentId);

      expect(result.changes).toBe(0);
    });
  });

  describe('Is user banned', () => {
    it('should detect banned user', () => {
      db.prepare('UPDATE users SET banned_at = ? WHERE id = ?').run(now, studentId);

      const row = db.prepare(
        'SELECT banned_at FROM users WHERE id = ? AND banned_at IS NOT NULL AND deleted_at IS NULL'
      ).get(studentId);

      expect(row).not.toBeUndefined();
    });

    it('should not flag non-banned user', () => {
      const row = db.prepare(
        'SELECT banned_at FROM users WHERE id = ? AND banned_at IS NOT NULL AND deleted_at IS NULL'
      ).get(studentId);

      expect(row).toBeUndefined();
    });

    it('should not flag banned + deleted user', () => {
      db.prepare('UPDATE users SET banned_at = ?, deleted_at = ? WHERE id = ?').run(now, now, studentId);

      const row = db.prepare(
        'SELECT banned_at FROM users WHERE id = ? AND banned_at IS NOT NULL AND deleted_at IS NULL'
      ).get(studentId);

      expect(row).toBeUndefined();
    });
  });

  describe('Get banned users', () => {
    it('should list all banned users', () => {
      db.prepare('UPDATE users SET banned_at = ?, ban_reason = ?, banned_by = ? WHERE id = ?').run(now, 'Spam', adminId, studentId);

      const banned = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.banned_at, u.ban_reason, u.banned_by,
               a.name as banned_by_name, u.created_at
        FROM users u
        LEFT JOIN users a ON u.banned_by = a.id
        WHERE u.banned_at IS NOT NULL AND u.deleted_at IS NULL
        ORDER BY u.banned_at DESC
      `).all() as Array<{ id: string; banned_by_name: string }>;

      expect(banned.length).toBe(1);
      expect(banned[0].id).toBe(studentId);
      expect(banned[0].banned_by_name).toBe('Admin');
    });

    it('should return empty array when no banned users', () => {
      const banned = db.prepare(`
        SELECT u.id FROM users u
        WHERE u.banned_at IS NOT NULL AND u.deleted_at IS NULL
      `).all();

      expect(banned.length).toBe(0);
    });
  });
});
