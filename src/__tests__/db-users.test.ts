import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const TEST_DB_PATH = path.join(process.cwd(), 'data', `test-db-users-${crypto.randomUUID().slice(0, 8)}.db`);

describe('db/users module', () => {
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

  it('createUser creates a user and returns it', async () => {
    const { createUser } = await import('@/lib/db/users');
    const user = await createUser('test-db@example.com', 'Test User', 'password123');
    expect(user).not.toBeNull();
    expect(user!.email).toBe('test-db@example.com');
    expect(user!.name).toBe('Test User');
    expect(user!.role).toBe('student');
    expect(user!.id).toBeDefined();
  });

  it('createUser returns null for duplicate email', async () => {
    const { createUser } = await import('@/lib/db/users');
    const user = await createUser('test-db@example.com', 'Another', 'password123');
    expect(user).toBeNull();
  });

  it('findUserByEmail finds existing user', async () => {
    const { findUserByEmail } = await import('@/lib/db/users');
    const user = await findUserByEmail('test-db@example.com');
    expect(user).not.toBeNull();
    expect(user!.email).toBe('test-db@example.com');
    expect(user!.password_hash).toBeDefined();
  });

  it('findUserByEmail returns null for missing email', async () => {
    const { findUserByEmail } = await import('@/lib/db/users');
    const user = await findUserByEmail('nonexistent-db@example.com');
    expect(user).toBeNull();
  });

  it('verifyPassword returns user for correct password', async () => {
    const { verifyPassword } = await import('@/lib/db/users');
    const user = await verifyPassword('test-db@example.com', 'password123');
    expect(user).not.toBeNull();
    expect(user!.email).toBe('test-db@example.com');
  });

  it('verifyPassword returns null for wrong password', async () => {
    const { verifyPassword } = await import('@/lib/db/users');
    const user = await verifyPassword('test-db@example.com', 'wrongpassword');
    expect(user).toBeNull();
  });

  it('getUserById returns user', async () => {
    const { createUser, getUserById } = await import('@/lib/db/users');
    const created = await createUser('byid-db@example.com', 'By ID', 'pass123');
    expect(created).not.toBeNull();
    const user = await getUserById(created!.id);
    expect(user).not.toBeNull();
    expect(user!.name).toBe('By ID');
  });

  it('getUserById returns null for missing user', async () => {
    const { getUserById } = await import('@/lib/db/users');
    const user = await getUserById('nonexistent-id');
    expect(user).toBeNull();
  });

  it('updateUser updates fields', async () => {
    const { createUser, updateUser, getUserById } = await import('@/lib/db/users');
    const created = await createUser('update-db@example.com', 'Update Me', 'pass123');
    expect(created).not.toBeNull();
    const result = await updateUser(created!.id, { name: 'Updated Name' });
    expect(result).toBe(true);
    const updated = await getUserById(created!.id);
    expect(updated!.name).toBe('Updated Name');
  });

  it('updatePassword hashes and stores new password', async () => {
    const { createUser, updatePassword, verifyPassword } = await import('@/lib/db/users');
    const created = await createUser('changepw-db@example.com', 'Change PW', 'oldpass');
    expect(created).not.toBeNull();
    const result = await updatePassword(created!.id, 'newpass');
    expect(result).toBe(true);
    const verified = await verifyPassword('changepw-db@example.com', 'newpass');
    expect(verified).not.toBeNull();
    const oldVerified = await verifyPassword('changepw-db@example.com', 'oldpass');
    expect(oldVerified).toBeNull();
  });

  it('logAudit creates audit entry', async () => {
    const { createUser, logAudit } = await import('@/lib/db/users');
    const actor = await createUser('actor-db@example.com', 'Actor', 'pass123');
    expect(actor).not.toBeNull();
    expect(() => logAudit(actor!.id, 'test_action', 'user', 'target-id', '{"key":"value"}')).not.toThrow();
  });
});
