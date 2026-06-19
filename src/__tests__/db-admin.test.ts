import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const TEST_DB_PATH = path.join(process.cwd(), 'data', `test-db-admin-${crypto.randomUUID().slice(0, 8)}.db`);

describe('db/admin module', () => {
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

  async function createTestUser(email = 'admin-test@example.com') {
    const { createUser } = await import('@/lib/db/users');
    return createUser(email, 'Admin Test', 'pass123');
  }

  it('getAllUsers returns users', async () => {
    await createTestUser('allusers@example.com');
    const { getAllUsers } = await import('@/lib/db/admin');
    const users = getAllUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('updateUserRole changes role', async () => {
    const user = await createTestUser('rolechange@example.com');
    const { updateUserRole } = await import('@/lib/db/admin');
    const result = updateUserRole(user!.id, 'teacher', user!.id);
    expect(result).toBe(true);
  });

  it('updateUserRole throws on invalid role', async () => {
    const user = await createTestUser('invalidrole@example.com');
    const { updateUserRole } = await import('@/lib/db/admin');
    expect(() => updateUserRole(user!.id, 'superadmin' as never)).toThrow('Invalid role');
  });

  it('softDeleteUser marks user as deleted', async () => {
    const user = await createTestUser('softdelete@example.com');
    const { softDeleteUser } = await import('@/lib/db/admin');
    const result = softDeleteUser(user!.id);
    expect(result).toBe(true);
  });

  it('restoreUser restores soft-deleted user', async () => {
    const user = await createTestUser('restore@example.com');
    const { softDeleteUser, restoreUser } = await import('@/lib/db/admin');
    softDeleteUser(user!.id);
    const result = restoreUser(user!.id);
    expect(result).toBe(true);
  });

  it('banUser and unbanUser work', async () => {
    const user = await createTestUser('banunban@example.com');
    const { banUser, unbanUser, isUserBanned } = await import('@/lib/db/admin');
    banUser(user!.id, 'test reason', user!.id);
    expect(isUserBanned(user!.id)).toBe(true);
    unbanUser(user!.id, user!.id);
    expect(isUserBanned(user!.id)).toBe(false);
  });

  it('getBannedUsers returns banned users', async () => {
    const user = await createTestUser('bannedlist@example.com');
    const { banUser, getBannedUsers } = await import('@/lib/db/admin');
    banUser(user!.id, 'test', user!.id);
    const banned = getBannedUsers();
    expect(banned.some((b) => b.email === 'bannedlist@example.com')).toBe(true);
  });

  it('getDeletedUsers returns deleted users', async () => {
    const user = await createTestUser('deletedlist@example.com');
    const { softDeleteUser, getDeletedUsers } = await import('@/lib/db/admin');
    softDeleteUser(user!.id);
    const deleted = getDeletedUsers();
    expect(deleted.some((d) => d.email === 'deletedlist@example.com')).toBe(true);
  });

  it('bulkUpdateRole updates multiple users', async () => {
    const u1 = await createTestUser('bulk1@example.com');
    const u2 = await createTestUser('bulk2@example.com');
    const { bulkUpdateRole } = await import('@/lib/db/admin');
    const count = bulkUpdateRole([u1!.id, u2!.id], 'teacher', u1!.id);
    expect(count).toBe(2);
  });

  it('bulkSoftDelete deletes multiple users', async () => {
    const u1 = await createTestUser('bulkdel1@example.com');
    const u2 = await createTestUser('bulkdel2@example.com');
    const { bulkSoftDelete } = await import('@/lib/db/admin');
    const count = bulkSoftDelete([u1!.id, u2!.id], u1!.id);
    expect(count).toBe(2);
  });

  it('updateUserDetails updates name and email', async () => {
    const user = await createTestUser('details@example.com');
    const { updateUserDetails } = await import('@/lib/db/admin');
    const result = updateUserDetails(user!.id, { name: 'New Name', email: 'details-new@example.com' });
    expect(result).toBe(true);
  });

  it('getAuditTrail returns entries', async () => {
    const { getAuditTrail } = await import('@/lib/db/admin');
    const trail = getAuditTrail(10);
    expect(Array.isArray(trail)).toBe(true);
  });
});
