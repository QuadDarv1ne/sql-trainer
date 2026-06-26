import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger';

function getDbPath(): string {
  return process.env.DATABASE_PATH || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'users.db');
}

let _dbPath: string | null = null;
export function DB_PATH(): string {
  if (!_dbPath) _dbPath = getDbPath();
  return _dbPath;
}

let _db: Database.Database | null = null;
let _dbClosing = false;

export function getDb(): Database.Database {
  if (_dbClosing) {
    throw new Error('Database is closing');
  }
  if (_db) return _db;

  const dir = path.dirname(DB_PATH());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    _db = new Database(DB_PATH(), {
      timeout: 5000,
    });
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('busy_timeout = 5000');
  } catch (err) {
    logger.error('Failed to open database', err);
    throw new Error(`Database initialization failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return _db;
}

/**
 * Gracefully close the database connection.
 * Call this during shutdown to ensure WAL checkpoint and file handles are released.
 */
export function closeDb(): void {
  if (_dbClosing) return;
  _dbClosing = true;

  if (_db) {
    try {
      _db.close();
    } catch (err) {
      logger.error('Error closing database', err);
    }
    _db = null;
    _dbPath = null;
    logger.info('Database closed');
  }
}

// Auto-close on process exit for graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => closeDb());
  process.on('SIGINT', () => {
    closeDb();
    process.exit(0);
  });
}
