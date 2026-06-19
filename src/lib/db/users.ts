import bcrypt from 'bcryptjs';
import { getDb } from './connection';
import { type UserRole, VALID_ROLES } from './types';
import { logger } from '../logger';

export async function createUser(
  email: string,
  name: string,
  password: string,
  phone?: string,
  role: UserRole = 'student',
  actorId?: string,
): Promise<{ id: string; email: string; name: string; phone: string | null; role: UserRole } | null> {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return null;

    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const hash = await bcrypt.hash(password, 12);

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, email, name, hash, phone || null, role, now, now);

    if (actorId) {
      logAudit(actorId, 'user_created', 'user', id, JSON.stringify({ email, name, role }));
    }

    return { id, email, name, phone: phone || null, role };
  } catch (error) {
    logger.error('createUser failed:', error);
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string;
  role: UserRole;
  role_changed_at: number | null;
  banned_at: number | null;
} | null> {
  try {
    const db = getDb();
    const user = db
      .prepare(
        'SELECT id, email, name, phone, password_hash, role, role_changed_at, banned_at FROM users WHERE email = ?',
      )
      .get(email) as
      | {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          password_hash: string;
          role: UserRole;
          role_changed_at: number | null;
          banned_at: number | null;
        }
      | undefined;
    return user || null;
  } catch (error) {
    logger.error('findUserByEmail failed:', error);
    return null;
  }
}

export async function verifyPassword(
  email: string,
  password: string,
): Promise<{
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  role_changed_at: number | null;
  banned_at: number | null;
} | null> {
  try {
    const user = await findUserByEmail(email);
    if (!user) return null;
    if (user.banned_at) return null;
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      role_changed_at: user.role_changed_at,
      banned_at: user.banned_at,
    };
  } catch (error) {
    logger.error('verifyPassword failed:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<{
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: number;
} | null> {
  try {
    const db = getDb();
    const user = db
      .prepare('SELECT id, email, name, phone, avatar_url, role, created_at FROM users WHERE id = ?')
      .get(userId) as
      | {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: number;
        }
      | undefined;
    return user || null;
  } catch (error) {
    logger.error('getUserById failed:', error);
    return null;
  }
}

export async function findUserByIdWithHash(userId: string): Promise<{
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string;
  role: UserRole;
} | null> {
  try {
    const db = getDb();
    const user = db
      .prepare('SELECT id, email, name, phone, password_hash, role FROM users WHERE id = ?')
      .get(userId) as
      | { id: string; email: string; name: string; phone: string | null; password_hash: string; role: UserRole }
      | undefined;
    return user || null;
  } catch (error) {
    logger.error('findUserByIdWithHash failed:', error);
    return null;
  }
}

export async function updateUser(
  userId: string,
  data: { name?: string; phone?: string; avatar_url?: string; email?: string },
): Promise<boolean> {
  try {
    const db = getDb();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(userId);

    const result = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  } catch (error) {
    logger.error('updateUser failed:', error);
    return false;
  }
}

export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const db = getDb();
    const hash = await bcrypt.hash(newPassword, 12);
    const result = db
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(hash, Date.now(), userId);
    return result.changes > 0;
  } catch (error) {
    logger.error('updatePassword failed:', error);
    return false;
  }
}

export async function createResetCode(userId: string, type: 'email' | 'phone'): Promise<string> {
  try {
    const db = getDb();
    const cryptoArray = new Uint32Array(1);
    crypto.getRandomValues(cryptoArray);
    const code = (100000 + (cryptoArray[0] % 900000)).toString();
    const id = crypto.randomUUID();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    db.prepare('INSERT INTO reset_codes (id, user_id, code, type, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)').run(
      id,
      userId,
      code,
      type,
      expiresAt,
    );

    return code;
  } catch (error) {
    logger.error('createResetCode failed:', error);
    throw error;
  }
}

export async function verifyResetCode(code: string): Promise<{ userId: string; type: string } | null> {
  try {
    const db = getDb();
    const now = Date.now();

    const result = db
      .prepare('UPDATE reset_codes SET used = 1 WHERE code = ? AND used = 0 AND expires_at > ?')
      .run(code, now);

    if (result.changes === 0) return null;

    const record = db.prepare('SELECT user_id, type FROM reset_codes WHERE code = ?').get(code) as
      | { user_id: string; type: string }
      | undefined;

    return record ? { userId: record.user_id, type: record.type } : null;
  } catch (error) {
    logger.error('verifyResetCode failed:', error);
    return null;
  }
}

export function logAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: string,
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO audit_log (id, actor_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(crypto.randomUUID(), actorId, action, targetType, targetId, details || null, Date.now());
}
