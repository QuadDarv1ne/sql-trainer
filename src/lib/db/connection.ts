import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function getDbPath(): string {
  return process.env.DATABASE_PATH || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'users.db');
}

let _dbPath: string | null = null;
export function DB_PATH(): string {
  if (!_dbPath) _dbPath = getDbPath();
  return _dbPath;
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH(), {
    timeout: 5000,
  });
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('busy_timeout = 5000');

  return _db;
}
