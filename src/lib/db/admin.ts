import { getDb } from './connection';
import { type UserRole, VALID_ROLES } from './types';
import { logAudit } from './users';

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
  banned_at: number | null;
  ban_reason: string | null;
}

export function getAllUsers(): UserSummary[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_active,
           u.banned_at, u.ban_reason,
           COUNT(up.task_id) as tasks_completed,
           COALESCE(ROUND(AVG(up.attempts * 1.0), 2), 0) as avg_attempts,
           (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_active
    ORDER BY u.created_at DESC
  `,
    )
    .all() as UserSummary[];
}

export function updateUserRole(userId: string, role: UserRole, actorId?: string): boolean {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare('UPDATE users SET role = ?, role_changed_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
    .run(role, now, now, userId);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'role_changed', 'user', userId, JSON.stringify({ role }));
  }
  return result.changes > 0;
}

export function updateUserDetails(
  userId: string,
  updates: { name?: string; email?: string; phone?: string | null },
  actorId?: string,
): boolean {
  const db = getDb();
  const parts: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    parts.push('name = ?');
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    parts.push('email = ?');
    values.push(updates.email);
  }
  if (updates.phone !== undefined) {
    parts.push('phone = ?');
    values.push(updates.phone || null);
  }

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

export function softDeleteUser(userId: string, actorId?: string): boolean {
  const db = getDb();
  const result = db
    .prepare('UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
    .run(Date.now(), Date.now(), userId);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'soft_delete', 'user', userId);
  }
  return result.changes > 0;
}

export function restoreUser(userId: string, actorId?: string): boolean {
  const db = getDb();
  const result = db
    .prepare('UPDATE users SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL')
    .run(Date.now(), userId);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'restore_user', 'user', userId);
  }
  return result.changes > 0;
}

export function banUser(userId: string, reason: string | null, actorId: string): boolean {
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare(
      'UPDATE users SET banned_at = ?, ban_reason = ?, banned_by = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    )
    .run(now, reason, actorId, now, userId);
  if (result.changes > 0) {
    logAudit(actorId, 'ban_user', 'user', userId, JSON.stringify({ reason }));
  }
  return result.changes > 0;
}

export function unbanUser(userId: string, actorId: string): boolean {
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare(
      'UPDATE users SET banned_at = NULL, ban_reason = NULL, banned_by = NULL, updated_at = ? WHERE id = ? AND banned_at IS NOT NULL',
    )
    .run(now, userId);
  if (result.changes > 0) {
    logAudit(actorId, 'unban_user', 'user', userId);
  }
  return result.changes > 0;
}

export function isUserBanned(userId: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT banned_at FROM users WHERE id = ? AND banned_at IS NOT NULL AND deleted_at IS NULL')
    .get(userId);
  return row !== undefined;
}

export function getBannedUsers(): {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  banned_at: number;
  ban_reason: string | null;
  banned_by: string | null;
  banned_by_name: string | null;
  created_at: number;
}[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT u.id, u.name, u.email, u.role, u.banned_at, u.ban_reason, u.banned_by,
           a.name as banned_by_name, u.created_at
    FROM users u
    LEFT JOIN users a ON u.banned_by = a.id
    WHERE u.banned_at IS NOT NULL AND u.deleted_at IS NULL
    ORDER BY u.banned_at DESC
  `,
    )
    .all() as {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    banned_at: number;
    ban_reason: string | null;
    banned_by: string | null;
    banned_by_name: string | null;
    created_at: number;
  }[];
}

export function getDeletedUsers(): {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  deleted_at: number;
  created_at: number;
}[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT id, name, email, role, deleted_at, created_at
    FROM users
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
  `,
    )
    .all() as { id: string; name: string; email: string; role: UserRole; deleted_at: number; created_at: number }[];
}

export function bulkUpdateRole(userIds: string[], role: UserRole, actorId?: string): number {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const db = getDb();
  const placeholders = userIds.map(() => '?').join(',');
  const stmt = db.prepare(
    `UPDATE users SET role = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
  );
  const result = stmt.run(role, Date.now(), ...userIds);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'bulk_role_change', 'user', null, JSON.stringify({ userIds, role, changed: result.changes }));
  }
  return result.changes;
}

export function bulkSoftDelete(userIds: string[], actorId?: string): number {
  const db = getDb();
  const placeholders = userIds.map(() => '?').join(',');
  const now = Date.now();
  const stmt = db.prepare(
    `UPDATE users SET deleted_at = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
  );
  const result = stmt.run(now, now, ...userIds);
  if (result.changes > 0 && actorId) {
    logAudit(actorId, 'bulk_soft_delete', 'user', null, JSON.stringify({ userIds, deleted: result.changes }));
  }
  return result.changes;
}

export function getAuditTrail(
  limit = 100,
  offset = 0,
): {
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
  return db
    .prepare(
      `
    SELECT a.id, a.actor_id, u.name as actor_name, a.action, a.target_type, a.target_id, a.details, a.created_at
    FROM audit_log a
    JOIN users u ON a.actor_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `,
    )
    .all(limit, offset) as {
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
