import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-db-connection.db');

describe('db/connection module', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = TEST_DB_PATH;
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

  it('creates database file', async () => {
    const { getDb } = await import('@/lib/db/connection');
    const db = getDb();
    expect(db).toBeDefined();
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
  });

  it('returns same instance on multiple calls', async () => {
    const { getDb } = await import('@/lib/db/connection');
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2);
  });

  it('sets WAL journal mode', async () => {
    const { getDb } = await import('@/lib/db/connection');
    const db = getDb();
    const journal = db.pragma('journal_mode', { simple: true });
    expect(journal).toBe('wal');
  });

  it('enables foreign keys', async () => {
    const { getDb } = await import('@/lib/db/connection');
    const db = getDb();
    const fk = db.pragma('foreign_keys', { simple: true });
    expect(fk).toBe(1);
  });

  it('DB_PATH returns correct path', async () => {
    const { DB_PATH } = await import('@/lib/db/connection');
    expect(DB_PATH()).toBe(TEST_DB_PATH);
  });
});
