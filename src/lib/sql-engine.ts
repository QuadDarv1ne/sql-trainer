/**
 * SQL Execution Engine
 * Wraps better-sqlite3 to execute SQL queries with support for both SQLite and PostgreSQL syntax.
 */
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import Database from 'better-sqlite3';
import { adaptPostgreSQLToSQLite, detectDroppedFunctions as detectPgDroppedFunctions } from './postgresql-adapter';
import { adaptClickHouseToSQLite } from './clickhouse-adapter';
import { adaptMySQLToSQLite, detectDroppedFunctions as detectMysqlDroppedFunctions } from './mysql-adapter';
import { t } from './i18n';

export interface QueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime: number;
  message?: string;
  affectedRows?: number;
  suggestion?: string;
  explainPlan?: string;
  warnings?: string[];
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

export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prev = i > 0 ? sql[i - 1] : '';
    const next = sql[i + 1];

    // Handle block comments
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i++; // skip both * and /
      }
      // Don't add comment characters to current
      continue;
    }

    if (char === '-' && next === '-' && !inString) {
      inComment = true;
      // Don't add comment characters to current
      continue;
    }

    if (inComment) {
      if (char === '\n') {
        inComment = false;
        current += char; // preserve newline
      }
      // Don't add comment characters to current
      continue;
    }

    if (char === '/' && next === '*' && !inString) {
      inBlockComment = true;
      i++; // skip both / and *
      // Don't add comment characters to current
      continue;
    }

    // Handle strings
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      if (char === stringChar) {
        // SQL uses '' for escaped quotes
        if (next === stringChar) {
          i++;
          current += next;
        } else if (prev === '\\') {
          // Backslash-escaped quote — don't end the string
          // Remove the backslash from current since SQLite doesn't use it
          current = current.slice(0, -2); // remove backslash + quote
          current += char; // re-add just the quote
        } else {
          inString = false;
        }
      }
      continue;
    }

    // Split on semicolons
    if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // Add remaining statement
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

/**
 * Strip leading SQL comments (line and block) to get the actual first token.
 */
function stripLeadingComments(sql: string): string {
  let result = sql.trim();

  // Strip leading comments (both line and block, in any order)
  let changed = true;
  while (changed) {
    changed = false;
    if (result.startsWith('/*')) {
      const end = result.indexOf('*/');
      if (end === -1) {
        return '';
      }
      result = result.slice(end + 2).trim();
      changed = true;
    } else if (result.startsWith('--')) {
      const newline = result.indexOf('\n');
      if (newline === -1) {
        return '';
      }
      result = result.slice(newline + 1).trim();
      changed = true;
    }
  }

  return result;
}

function isSelectQuery(sql: string): boolean {
  const trimmed = stripLeadingComments(sql).toUpperCase();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('SELECT') ||
    trimmed.startsWith('PRAGMA') ||
    trimmed.startsWith('EXPLAIN') ||
    trimmed.startsWith('WITH')
  );
}

function isEmptyOrComment(sql: string): boolean {
  return !stripLeadingComments(sql);
}

const UNSUPPORTED_FUNC_WARNING = (func: string) =>
  `Функция "${func}" не поддерживается в SQLite-режиме и будет пропущена. Результат может отличаться.`;

/**
 * Adapt SQL from PostgreSQL/ClickHouse/MySQL to SQLite.
 * Returns the adapted SQL and any warnings about unsupported functions.
 */
function adaptSqlForExecution(
  sql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql'
): { processedSql: string; warnings: string[] } {
  if (dbType === 'postgresql') {
    const dropped = detectPgDroppedFunctions(sql);
    return { processedSql: adaptPostgreSQLToSQLite(sql), warnings: dropped.map(UNSUPPORTED_FUNC_WARNING) };
  }
  if (dbType === 'clickhouse') {
    return { processedSql: adaptClickHouseToSQLite(sql), warnings: [] };
  }
  if (dbType === 'mysql') {
    const adapted = adaptMySQLToSQLite(sql);
    const dropped = detectMysqlDroppedFunctions(sql, adapted);
    return { processedSql: adapted, warnings: dropped.map(UNSUPPORTED_FUNC_WARNING) };
  }
  return { processedSql: sql, warnings: [] };
}

/**
 * Adapt schema SQL from PostgreSQL/ClickHouse/MySQL to SQLite.
 */
function adaptSchemaForDbType(
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql'
): string {
  if (dbType === 'postgresql') return adaptPostgreSQLToSQLite(schemaSql);
  if (dbType === 'clickhouse') return adaptClickHouseToSQLite(schemaSql);
  if (dbType === 'mysql') return adaptMySQLToSQLite(schemaSql);
  return schemaSql;
}

function isDDL(sql: string): boolean {
  const trimmed = stripLeadingComments(sql).toUpperCase();
  return (
    trimmed.startsWith('CREATE') ||
    trimmed.startsWith('DROP') ||
    trimmed.startsWith('ALTER') ||
    trimmed.startsWith('TRUNCATE')
  );
}

/**
 * Generate helpful suggestions based on error messages.
 */
function getSuggestionForError(error: string): string | undefined {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('no such table')) {
    const match = error.match(/no such table: (\w+)/i);
    if (match) {
      return t('sql.error.tableNotExist', { table: match[1] });
    }
    return t('sql.error.tableNotExistGeneric');
  }

  if (lowerError.includes('no such column')) {
    const match = error.match(/no such column: (\w+)/i);
    if (match) {
      return t('sql.error.columnNotFound', { column: match[1] });
    }
    return t('sql.error.columnNotFoundGeneric');
  }

  if (lowerError.includes('ambiguous column name')) {
    return t('sql.error.ambiguousColumn');
  }

  if (lowerError.includes('syntax error') && lowerError.includes('near')) {
    return t('sql.error.syntax');
  }

  if (lowerError.includes('aggregate function')) {
    return t('sql.error.aggregateInWhere');
  }

  if (lowerError.includes('group by')) {
    return t('sql.error.groupBy');
  }

  if (lowerError.includes('unique constraint failed') || lowerError.includes('primary key')) {
    return t('sql.error.uniqueConstraint');
  }

  if (lowerError.includes('foreign key constraint failed')) {
    return t('sql.error.foreignKey');
  }

  if (lowerError.includes('cannot add foreign key')) {
    return t('sql.error.cannotAddForeignKey');
  }

  if (lowerError.includes('order by')) {
    return t('sql.error.orderBy');
  }

  if (lowerError.includes('limit')) {
    return t('sql.error.limit');
  }

  if (lowerError.includes('union') && lowerError.includes('different number')) {
    return t('sql.error.unionColumns');
  }

  if (lowerError.includes('subquery returned more than one row')) {
    return t('sql.error.subqueryMultipleRows');
  }

  if (lowerError.includes('division by zero')) {
    return t('sql.error.divisionByZero');
  }

  if (lowerError.includes('case') && lowerError.includes('end')) {
    return t('sql.error.caseSyntax');
  }

  if (lowerError.includes('window function')) {
    return t('sql.error.windowFunction');
  }

  if (lowerError.includes('partition by')) {
    return t('sql.error.partitionBy');
  }

  if (lowerError.includes('trigger')) {
    return t('sql.error.trigger');
  }

  if (lowerError.includes('transaction')) {
    return t('sql.error.transaction');
  }

  if (lowerError.includes('fts') || lowerError.includes('match')) {
    return t('sql.error.fts');
  }

  if (lowerError.includes('json')) {
    return t('sql.error.json');
  }

  if (lowerError.includes('date') || lowerError.includes('time')) {
    return t('sql.error.date');
  }

  return undefined;
}

/** Maximum number of rows returned by a query */
const MAX_ROWS = 1000;

/** Maximum query execution time in milliseconds */
const MAX_EXECUTION_TIME_MS = 5000;

/** Maximum number of cached schema databases */
const MAX_SCHEMA_CACHE_SIZE = 10;

/** Cache for initialized schema databases: key = schemaSql+dbType hash */
const schemaCache = new Map<string, Database.Database>();

/**
 * Generate cache key from schema SQL and db type.
 * Uses SHA-256 hash to avoid collisions for different schemas.
 */
function schemaCacheKey(schemaSql: string, dbType: string): string {
  const hash = createHash('sha256').update(schemaSql).digest('hex').slice(0, 16);
  return `${dbType}:${hash}`;
}

/**
 * Clone a cached database to a new in-memory instance with the same schema.
 * Uses SQL dump/restore approach for isolation.
 */
function cloneDatabase(source: Database.Database): Database.Database {
  const dump = source.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table', 'index')").all() as { sql: string }[];
  const tables = source.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  const newDb = new Database(':memory:');
  newDb.pragma('foreign_keys = ON');
  for (const { sql } of dump) {
    newDb.exec(sql);
  }
  // Copy data from each table
  for (const { name: tableName } of tables) {
    const rows = source.prepare(`SELECT * FROM "${tableName}"`).all() as Record<string, unknown>[];
    if (rows.length === 0) continue;
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
    const stmt = newDb.prepare(insertSql);
    const insertMany = newDb.transaction((batch: unknown[][]) => {
      for (const row of batch) {
        stmt.run(...(row as unknown[]));
      }
    });
    insertMany(rows.map(row => Object.values(row)));
  }
  return newDb;
}

/**
 * Evict oldest entry if cache is full
 */
function evictCacheIfFull(): void {
  if (schemaCache.size >= MAX_SCHEMA_CACHE_SIZE) {
    const firstKey = schemaCache.keys().next().value;
    if (firstKey) {
      schemaCache.get(firstKey)?.close();
      schemaCache.delete(firstKey);
    }
  }
}

/**
 * Move a key to the end of the cache (most recently used) for LRU behavior.
 */
function touchCacheKey(key: string): void {
  const value = schemaCache.get(key);
  if (value) {
    schemaCache.delete(key);
    schemaCache.set(key, value);
  }
}

/**
 * Execute prepared statements against an already-initialized database.
 * Shared logic between executeQuery and executeWithSchema.
 */
function executeStatements(
  db: Database.Database,
  statements: string[],
  batchStartTime: number
): QueryResult {
  let lastResult: QueryResult | null = null;

  for (const stmt of statements) {
    // Each statement gets its own timeout measurement
    const stmtStartTime = performance.now();

    // Skip empty or comment-only statements
    if (isEmptyOrComment(stmt)) {
      continue;
    }

    try {
      if (isSelectQuery(stmt)) {
        const statement = db.prepare(stmt);
        const columns = statement.columns().map((col) => col.name);
        let rows = statement.all() as Record<string, unknown>[];

        // Check timeout after execution
        const executionTime = performance.now() - stmtStartTime;
        if (executionTime > MAX_EXECUTION_TIME_MS) {
          throw new Error(
            t('sql.error.timeout', { seconds: String(MAX_EXECUTION_TIME_MS / 1000) })
          );
        }

        // Enforce row limit
        const truncated = rows.length > MAX_ROWS;
        if (truncated) {
          rows = rows.slice(0, MAX_ROWS);
        }

        lastResult = {
          success: true,
          columns,
          rows,
          executionTime,
          message: truncated
            ? t('sql.success.rowsLimited', { maxRows: String(MAX_ROWS) })
            : undefined,
        };
      } else if (isDDL(stmt)) {
        db.exec(stmt);
        const executionTime = performance.now() - stmtStartTime;
        lastResult = {
          success: true,
          columns: [],
          rows: [],
          executionTime,
          message: t('sql.success.ddl'),
        };
      } else {
        const statement = db.prepare(stmt);
        const result = statement.run();
        const executionTime = performance.now() - stmtStartTime;
        lastResult = {
          success: true,
          columns: [],
          rows: [],
          executionTime,
          message: t('sql.success.dml', { changes: String(result.changes) }),
          affectedRows: result.changes,
        };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        columns: [],
        rows: [],
        error: errorMsg,
        executionTime: performance.now() - stmtStartTime,
        suggestion: getSuggestionForError(errorMsg),
      };
    }
  }

  if (lastResult) return lastResult;

  return {
    success: true,
    columns: [],
    rows: [],
    executionTime: performance.now() - batchStartTime,
    message: t('sql.success.generic'),
  };
}

export function executeQuery(
  sql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql' = 'sqlite'
): QueryResult {
  const startTime = performance.now();
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    const { processedSql, warnings } = adaptSqlForExecution(sql, dbType);

    const statements = splitStatements(processedSql);
    const result = executeStatements(db, statements, startTime);
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      columns: [],
      rows: [],
      error: errorMsg,
      executionTime: performance.now() - startTime,
    };
  } finally {
    db.close();
  }
}

export function executeWithSchema(
  sql: string,
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql' = 'sqlite'
): QueryResult {
  const startTime = performance.now();
  const cacheKey = schemaCacheKey(schemaSql, dbType);
  let db: Database.Database | null = null;
  let clonedDb: Database.Database | null = null;

  try {
    // Check cache first
    const cached = schemaCache.get(cacheKey);
    if (cached) {
      touchCacheKey(cacheKey); // Mark as recently used
      clonedDb = cloneDatabase(cached);
      db = clonedDb;
    } else {
      db = new Database(':memory:');
      db.pragma('foreign_keys = ON');

      const processedSchema = adaptSchemaForDbType(schemaSql, dbType);

      try {
        db.exec(processedSchema);
        // Cache the schema template
        evictCacheIfFull();
        schemaCache.set(cacheKey, db);
        const cachedDb = schemaCache.get(cacheKey);
        if (!cachedDb) throw new Error('Failed to cache database template');
        db = null; // db is now in cache, don't close it in finally
        clonedDb = cloneDatabase(cachedDb);
        db = clonedDb;
      } catch (schemaErr: unknown) {
        const msg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
        db?.close();
        db = null;
        return {
          success: false,
          columns: [],
          rows: [],
          error: t('sql.error.schemaCreate', { message: msg }),
          executionTime: performance.now() - startTime,
        };
      }
    }

    const { processedSql, warnings } = adaptSqlForExecution(sql, dbType);

    const statements = splitStatements(processedSql);
    const result = executeStatements(db, statements, startTime);
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      columns: [],
      rows: [],
      error: errorMsg,
      executionTime: performance.now() - startTime,
    };
  } finally {
    clonedDb?.close();
    // Close db only if it wasn't put in cache (i.e. clonedDb is same as db)
    if (db && db !== clonedDb) {
      db.close();
    }
  }
}

/**
 * Initialize schema once, then execute multiple SQL inputs on the same database.
 * Returns an array of QueryResult corresponding to each input SQL.
 * This is essential for verification of DML tasks where INSERTs/UPDATEs must
 * persist across the user's query and the solution's SELECT.
 */
export function executeWithSchemaMulti(
  sqlInputs: string[],
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql' = 'sqlite'
): QueryResult[] {
  const startTime = performance.now();
  const cacheKey = schemaCacheKey(schemaSql, dbType);
  let db: Database.Database | null = null;
  let clonedDb: Database.Database | null = null;

  try {
    // Check cache first
    const cached = schemaCache.get(cacheKey);
    if (cached) {
      touchCacheKey(cacheKey); // Mark as recently used
      clonedDb = cloneDatabase(cached);
      db = clonedDb;
    } else {
      db = new Database(':memory:');
      db.pragma('foreign_keys = ON');

      const processedSchema = adaptSchemaForDbType(schemaSql, dbType);

      try {
        db.exec(processedSchema);
        // Cache the schema template
        evictCacheIfFull();
        schemaCache.set(cacheKey, db);
        const cachedDb = schemaCache.get(cacheKey);
        if (!cachedDb) throw new Error('Failed to cache database template');
        db = null;
        clonedDb = cloneDatabase(cachedDb);
        db = clonedDb;
      } catch (schemaErr: unknown) {
        const msg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
        db?.close();
        db = null;
        const errorResult: QueryResult = {
          success: false,
          columns: [],
          rows: [],
          error: t('sql.error.schemaCreate', { message: msg }),
          executionTime: performance.now() - startTime,
        };
        return sqlInputs.map(() => ({ ...errorResult }));
      }
    }

    const results: QueryResult[] = [];
    for (const sql of sqlInputs) {
      const { processedSql, warnings } = adaptSqlForExecution(sql, dbType);

      const statements = splitStatements(processedSql);
      const result = executeStatements(db, statements, startTime);
      if (warnings.length > 0) {
        result.warnings = warnings;
      }
      results.push(result);
    }

    return results;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorResult: QueryResult = {
      success: false,
      columns: [],
      rows: [],
      error: errorMsg,
      executionTime: performance.now() - startTime,
    };
    return sqlInputs.map(() => ({ ...errorResult }));
  } finally {
    clonedDb?.close();
    if (db && db !== clonedDb) {
      db.close();
    }
  }
}

export function getSchemaInfo(
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql' = 'sqlite'
): DatabaseInfo {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    const processedSchema = adaptSchemaForDbType(schemaSql, dbType);

    db.exec(processedSchema);

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as { name: string }[];

    const tableInfos: TableInfo[] = tables.map((table) => {
      const columns = db
        .prepare(`PRAGMA table_info("${table.name}")`)
        .all() as {
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }[];

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

    return { tables: tableInfos };
  } finally {
    db.close();
  }
}

/**
 * Execute EXPLAIN QUERY PLAN on a SQL statement.
 * Returns the execution plan as a formatted string.
 */
export function explainQuery(
  sql: string,
  schemaSql: string,
  dbType: 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql' | 'mongodb' = 'sqlite'
): { success: boolean; plan?: string; error?: string } {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    const processedSchema = adaptSchemaForDbType(schemaSql, dbType as 'sqlite' | 'postgresql' | 'clickhouse' | 'mysql');

    db.exec(processedSchema);

    // Execute EXPLAIN QUERY PLAN
    const explainSql = `EXPLAIN QUERY PLAN ${sql}`;
    const rows = db.prepare(explainSql).all() as Record<string, unknown>[];

    // Format the plan
    const plan = rows
      .map((row) => {
        // SQLite EXPLAIN QUERY PLAN returns columns: id, parent, notused, detail
        const detail = row['detail'] || row['Detail'] || '';
        return String(detail);
      })
      .join('\n');

    return { success: true, plan };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  } finally {
    db.close();
  }
}
