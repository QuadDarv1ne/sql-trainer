/**
 * SQL Execution Engine
 * Wraps better-sqlite3 to execute SQL queries with support for both SQLite and PostgreSQL syntax.
 */
import Database from 'better-sqlite3';
import { adaptPostgreSQLToSQLite } from './postgresql-adapter';

export interface QueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime: number;
  message?: string;
  affectedRows?: number;
  isExplain?: boolean;
}

export interface DatabaseInfo {
  tables: TableInfo[];
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: unknown;
  primaryKey: boolean;
}

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      current += char;
      continue;
    }

    if (char === '-' && next === '-' && !inString) {
      inComment = true;
      current += char;
      continue;
    }

    if (inComment) {
      current += char;
      if (char === '\n') inComment = false;
      continue;
    }

    if (char === '/' && next === '*' && !inString) {
      inBlockComment = true;
      current += char;
      continue;
    }

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      if (char === stringChar) {
        if (next === stringChar) {
          i++;
          current += next;
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);

  return statements;
}

function isSelectQuery(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN') || trimmed.startsWith('WITH');
}

function isDDL(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return trimmed.startsWith('CREATE') || trimmed.startsWith('DROP') || trimmed.startsWith('ALTER') || trimmed.startsWith('TRUNCATE');
}

export function executeQuery(
  sql: string,
  dbType: 'sqlite' | 'postgresql' = 'sqlite'
): QueryResult {
  const startTime = performance.now();
  let db: Database.Database | null = null;

  try {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    let processedSql = sql;
    if (dbType === 'postgresql') {
      processedSql = adaptPostgreSQLToSQLite(sql);
    }

    const statements = splitStatements(processedSql);
    let lastResult: QueryResult | null = null;

    for (const stmt of statements) {
      try {
        if (isSelectQuery(stmt)) {
          const statement = db.prepare(stmt);
          const columns = statement.columns().map((col) => col.name);
          const rows = statement.all() as Record<string, unknown>[];
          lastResult = { success: true, columns, rows, executionTime: performance.now() - startTime };
        } else if (isDDL(stmt)) {
          db.exec(stmt);
          lastResult = { success: true, columns: [], rows: [], executionTime: performance.now() - startTime, message: 'Операция DDL выполнена успешно' };
        } else {
          const statement = db.prepare(stmt);
          const result = statement.run();
          if (lastResult) {
            lastResult = { ...lastResult, executionTime: performance.now() - startTime, affectedRows: result.changes };
          } else {
            lastResult = { success: true, columns: [], rows: [], executionTime: performance.now() - startTime, message: `Запрос выполнен. Изменено строк: ${result.changes}`, affectedRows: result.changes };
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        db.close();
        return { success: false, columns: [], rows: [], error: errorMsg, executionTime: performance.now() - startTime };
      }
    }

    db.close();
    db = null;

    if (lastResult) return lastResult;
    return { success: true, columns: [], rows: [], executionTime: performance.now() - startTime, message: 'Запрос выполнен успешно' };
  } catch (err: unknown) {
    if (db) db.close();
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, columns: [], rows: [], error: errorMsg, executionTime: performance.now() - startTime };
  }
}

export function executeWithSchema(
  sql: string,
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' = 'sqlite'
): QueryResult {
  const startTime = performance.now();
  let db: Database.Database | null = null;

  try {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    let processedSchema = schemaSql;
    if (dbType === 'postgresql') {
      processedSchema = adaptPostgreSQLToSQLite(schemaSql);
    }

    try {
      db.exec(processedSchema);
    } catch (schemaErr: unknown) {
      const msg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
      db.close();
      return { success: false, columns: [], rows: [], error: `Ошибка создания схемы: ${msg}`, executionTime: performance.now() - startTime };
    }

    let processedSql = sql;
    if (dbType === 'postgresql') {
      processedSql = adaptPostgreSQLToSQLite(sql);
    }

    const statements = splitStatements(processedSql);
    let lastResult: QueryResult | null = null;

    for (const stmt of statements) {
      try {
        if (isSelectQuery(stmt)) {
          const statement = db.prepare(stmt);
          const columns = statement.columns().map((col) => col.name);
          const rows = statement.all() as Record<string, unknown>[];
          lastResult = { success: true, columns, rows, executionTime: performance.now() - startTime };
        } else if (isDDL(stmt)) {
          db.exec(stmt);
          lastResult = { success: true, columns: [], rows: [], executionTime: performance.now() - startTime, message: 'Операция DDL выполнена успешно' };
        } else {
          const statement = db.prepare(stmt);
          const result = statement.run();
          if (lastResult) {
            lastResult = { ...lastResult, executionTime: performance.now() - startTime, affectedRows: result.changes };
          } else {
            lastResult = { success: true, columns: [], rows: [], executionTime: performance.now() - startTime, message: `Запрос выполнен. Изменено строк: ${result.changes}`, affectedRows: result.changes };
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        db.close();
        return { success: false, columns: [], rows: [], error: errorMsg, executionTime: performance.now() - startTime };
      }
    }

    db.close();
    db = null;

    if (lastResult) return lastResult;
    return { success: true, columns: [], rows: [], executionTime: performance.now() - startTime, message: 'Запрос выполнен успешно' };
  } catch (err: unknown) {
    if (db) db.close();
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, columns: [], rows: [], error: errorMsg, executionTime: performance.now() - startTime };
  }
}

export function getSchemaInfo(
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' = 'sqlite'
): DatabaseInfo {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    let processedSchema = schemaSql;
    if (dbType === 'postgresql') {
      processedSchema = adaptPostgreSQLToSQLite(schemaSql);
    }

    db.exec(processedSchema);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const tableInfos: TableInfo[] = tables.map((table) => {
      const columns = db
        .prepare(`PRAGMA table_info("${table.name}")`)
        .all() as { name: string; type: string; notnull: number; dflt_value: unknown; pk: number }[];

      return {
        name: table.name,
        columns: columns.map((col) => ({
          name: col.name,
          type: col.type || 'TEXT',
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk > 0,
        })),
      };
    });

    db.close();
    return { tables: tableInfos };
  } catch (err: unknown) {
    db.close();
    throw err;
  }
}
