/**
 * PostgreSQL to SQLite syntax adapter.
 * Transforms PostgreSQL-specific SQL syntax into SQLite-compatible syntax.
 *
 * ⚠️ Unsupported PostgreSQL functions (mapped to null):
 * - Date/Time: DATE_TRUNC, EXTRACT, AGE, DATE_PART, MAKE_DATE, MAKE_TIME, MAKE_TIMESTAMP
 * - String: LEFT, RIGHT, LPAD, RPAD, REPEAT
 * - Math: CBRT, TRUNC, PI, LN, LOG, LOG10, EXP
 * - Conditional: GREATEST, LEAST
 * - Aggregation: GENERATE_SERIES
 * - JSON: ROW_TO_JSON, ARRAY_TO_JSON, JSON_BUILD_OBJECT, JSON_AGG
 * - Other: PG_SLEEP
 *
 * These functions will be silently removed from queries, which may cause
 * incorrect results when using PostgreSQL mode. Users should be aware of
 * these limitations when writing queries in training mode.
 */
import { splitSqlSegments } from './sql-utils';

// Map of PostgreSQL data types to SQLite equivalents
const TYPE_MAP: Record<string, string> = {
  SERIAL: 'INTEGER',
  BIGSERIAL: 'INTEGER',
  SMALLSERIAL: 'INTEGER',
  BOOLEAN: 'INTEGER',
  BOOL: 'INTEGER',
  VARCHAR: 'TEXT',
  CHAR: 'TEXT',
  CHARACTER: 'TEXT',
  NUMERIC: 'REAL',
  DECIMAL: 'REAL',
  MONEY: 'REAL',
  FLOAT4: 'REAL',
  FLOAT8: 'REAL',
  'DOUBLE PRECISION': 'REAL',
  TIMESTAMP: 'TEXT',
  TIMESTAMPTZ: 'TEXT',
  TIME: 'TEXT',
  TIMETZ: 'TEXT',
  DATE: 'TEXT',
  BYTEA: 'BLOB',
  JSON: 'TEXT',
  JSONB: 'TEXT',
  UUID: 'TEXT',
  CIDR: 'TEXT',
  INET: 'TEXT',
  MACADDR: 'TEXT',
  BIT: 'INTEGER',
  VARBIT: 'INTEGER',
  INTERVAL: 'TEXT',
  TSQUERY: 'TEXT',
  TSVECTOR: 'TEXT',
};

// PostgreSQL functions to SQLite equivalents
const FUNCTION_MAP: Record<string, string | null> = {
  STRING_AGG: 'GROUP_CONCAT',
  CONCAT_WS: 'GROUP_CONCAT', // not perfect but close
  GENERATE_SERIES: null, // will use recursive CTE
  ARRAY_AGG: 'GROUP_CONCAT',
  BOOL_AND: 'MIN', // 0/1 mapping
  BOOL_OR: 'MAX', // 0/1 mapping
  DATE_TRUNC: null, // complex, skip
  EXTRACT: null, // complex, skip
  CURRENT_DATE: "date('now')",
  CURRENT_TIME: "time('now')",
  CURRENT_TIMESTAMP: "datetime('now')",
  LOCALTIMESTAMP: "datetime('now')",
  LOCALTIME: "time('now')",
  NOW: "datetime('now')",
  PG_SLEEP: null, // not supported
  // String functions
  SUBSTRING: 'SUBSTR',
  SUBSTR: 'SUBSTR',
  LEFT: null, // use SUBSTR
  RIGHT: null, // use SUBSTR
  LPAD: null, // complex, skip
  RPAD: null, // complex, skip
  REPEAT: null, // not in SQLite
  // Date/time functions
  AGE: null, // complex, skip
  DATE_PART: null, // complex, skip
  MAKE_DATE: null, // not in SQLite
  MAKE_TIME: null, // not in SQLite
  MAKE_TIMESTAMP: null, // not in SQLite
  // Math functions
  POWER: 'POWER',
  SQRT: 'SQRT',
  CBRT: null, // not in SQLite
  ABS: 'ABS',
  CEIL: 'CEIL',
  CEILING: 'CEIL',
  FLOOR: 'FLOOR',
  ROUND: 'ROUND',
  TRUNC: null, // not in SQLite
  RANDOM: 'RANDOM',
  PI: null, // not in SQLite < 3.35
  LN: null, // not in SQLite < 3.35
  LOG: null, // not in SQLite < 3.35
  LOG10: null, // not in SQLite < 3.35
  EXP: null, // not in SQLite < 3.35
  // Conditional
  COALESCE: 'COALESCE',
  NULLIF: 'NULLIF',
  GREATEST: null, // not in SQLite
  LEAST: null, // not in SQLite
  // JSON
  ROW_TO_JSON: null, // complex, skip
  ARRAY_TO_JSON: null, // complex, skip
  JSON_BUILD_OBJECT: null, // complex, skip
  JSON_AGG: null, // complex, skip
  // Window functions (SQLite supports these since 3.25)
  ROW_NUMBER: 'ROW_NUMBER',
  RANK: 'RANK',
  DENSE_RANK: 'DENSE_RANK',
  NTILE: 'NTILE',
  LAG: 'LAG',
  LEAD: 'LEAD',
  FIRST_VALUE: 'FIRST_VALUE',
  LAST_VALUE: 'LAST_VALUE',
  NTH_VALUE: 'NTH_VALUE',
  SUM: 'SUM',
  AVG: 'AVG',
  COUNT: 'COUNT',
  MIN: 'MIN',
  MAX: 'MAX',
};

function applyFunctionReplacements(sql: string): string {
  // Use splitSqlSegments to avoid replacing function names inside string literals
  const segments = splitSqlSegments(sql);

  const processed = segments
    .map((segment, i) => {
      if (i % 2 === 1) return segment; // skip string literals
      let result = segment;

      // Replace known function names
      for (const [pgFunc, sqliteFunc] of Object.entries(FUNCTION_MAP)) {
        if (sqliteFunc && sqliteFunc !== pgFunc) {
          result = result.replace(new RegExp(`\\b${pgFunc}\\b`, 'gi'), sqliteFunc);
        }
      }

      return result;
    })
    .join('');

  return processed;
}

/**
 * Detect PostgreSQL functions in the SQL that would be silently dropped by the adapter.
 * Returns a list of function names that are present in the SQL but have no SQLite equivalent.
 */
export function detectDroppedFunctions(sql: string): string[] {
  const droppedFunctions = Object.entries(FUNCTION_MAP)
    .filter(([, sqliteFunc]) => sqliteFunc === null)
    .map(([pgFunc]) => pgFunc);

  const found: string[] = [];
  for (const func of droppedFunctions) {
    if (new RegExp(`\\b${func}\\b`, 'gi').test(sql)) {
      found.push(func);
    }
  }
  return found;
}

/**
 * Result of adapting PostgreSQL SQL to SQLite, including any warnings.
 */
export interface AdaptResult {
  sql: string;
  warnings: string[];
}

/**
 * Adapt PostgreSQL SQL to SQLite and return any warnings about dropped functions.
 */
export function adaptWithWarnings(sql: string): AdaptResult {
  const dropped = detectDroppedFunctions(sql);
  const warnings = dropped.map(
    (func) => `Функция "${func}" не поддерживается в SQLite-режиме и будет пропущена. Результат может отличаться.`,
  );
  return {
    sql: adaptPostgreSQLToSQLite(sql),
    warnings,
  };
}

export function adaptPostgreSQLToSQLite(sql: string): string {
  let result = sql;

  // Replace functions with no-arg SQLite equivalents (must happen before applyFunctionReplacements)
  // Use negative lookbehind to avoid matching inside other function names like datetime()
  result = result.replace(/(?<![.\w])NOW\s*\(\)/gi, "datetime('now')");
  result = result.replace(/(?<![.\w])CURRENT_DATE\s*\(\)/gi, "date('now')");
  result = result.replace(/(?<![.\w])CURRENT_TIME\s*\(\)/gi, "time('now')");
  result = result.replace(/(?<![.\w])CURRENT_TIMESTAMP\s*\(\)/gi, "datetime('now')");
  result = result.replace(/(?<![.\w])LOCALTIMESTAMP\s*\(\)/gi, "datetime('now')");
  result = result.replace(/(?<![.\w])LOCALTIME\s*\(\)/gi, "time('now')");

  // Replace BOOLEAN DEFAULT TRUE/FALSE
  result = result.replace(/\bDEFAULT\s+TRUE\b/gi, 'DEFAULT 1');
  result = result.replace(/\bDEFAULT\s+FALSE\b/gi, 'DEFAULT 0');

  // Replace TRUE/FALSE only in non-string segments to preserve string literals like 'TRUE'
  const segments = splitSqlSegments(result);
  result = segments
    .map((segment, i) => {
      if (i % 2 === 1) return segment; // skip string literals
      return segment.replace(/\bTRUE\b/g, '1').replace(/\bFALSE\b/g, '0');
    })
    .join('');

  // Replace ILIKE with LIKE (SQLite LIKE is case-insensitive by default for ASCII)
  result = result.replace(/\bILIKE\b/g, 'LIKE');

  // Replace SIMILAR TO with LIKE (approximate)
  result = result.replace(/\bSIMILAR\s+TO\b/gi, 'LIKE');

  // Replace DISTINCT ON - not supported in SQLite
  result = result.replace(/\bDISTINCT\s+ON\s*\([^)]+\)/gi, 'DISTINCT');

  // Replace ::type casting with CAST(expr AS type)
  // Match identifiers and string literals before ::
  result = result.replace(
    /([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*|'[^']*')\s*::([A-Za-z_]\w*(?:\s*\([^)]*\))?)/g,
    (_, expr, type) => {
      const trimmed = type.trim().toUpperCase();
      const mapped = TYPE_MAP[trimmed] || trimmed;
      return `CAST(${expr} AS ${mapped})`;
    },
  );

  // Replace function names from FUNCTION_MAP
  result = applyFunctionReplacements(result);

  // Replace STRING_AGG(expr, delimiter) with GROUP_CONCAT(expr, delimiter)
  result = result.replace(
    /\bSTRING_AGG\s*\(([^,]+),\s*([^)]+)\)/gi,
    (_, expr, delim) => `GROUP_CONCAT(${expr.trim()}, ${delim.trim()})`,
  );

  // Replace ARRAY_AGG with GROUP_CONCAT
  result = result.replace(/\bARRAY_AGG\s*\(([^)]+)\)/gi, 'GROUP_CONCAT($1)');

  // Replace IS TRUE / IS FALSE
  result = result.replace(/\bIS\s+TRUE\b/gi, '= 1');
  result = result.replace(/\bIS\s+FALSE\b/gi, '= 0');
  result = result.replace(/\bIS\s+NOT\s+TRUE\b/gi, '!= 1');
  result = result.replace(/\bIS\s+NOT\s+FALSE\b/gi, '!= 0');

  // Replace LIMIT ALL
  result = result.replace(/\bLIMIT\s+ALL\b/gi, 'LIMIT -1');

  // Replace RETURNING clause (not fully supported in SQLite for INSERT)
  // We'll just strip it for training purposes
  result = result.replace(/\bRETURNING\s+[\w\s,.*]+$/gim, '');

  // Replace ONLY keyword (FROM ONLY table -> FROM table)
  result = result.replace(/\bONLY\s+/gi, '');

  // Replace FOR UPDATE / FOR SHARE (row locking not supported in SQLite)
  result = result.replace(/\bFOR\s+(UPDATE|SHARE)(\s+OF\s+\w+)?(\s+NOWAIT|\s+SKIP\s+LOCKED)?$/gim, '');

  // Replace WITH clause modifiers (SEARCH, CYCLE)
  result = result.replace(/\bSEARCH\s+\w+\s+(?:BREADTH|DEPTH)\s+FIRST\s+BY\s+\w+\s+SET\s+\w+/gi, '');
  result = result.replace(/\bCYCLE\s+\w+\s+SET\s+\w+/gi, '');

  // Replace PostgreSQL data types in CREATE TABLE
  result = replaceDataTypes(result);

  // Replace ON CONFLICT ... DO NOTHING / DO UPDATE (SQLite supports this but syntax differs slightly)
  // SQLite actually supports ON CONFLICT since 3.24.0, so we can keep it

  return result;
}

function replaceDataTypes(sql: string): string {
  // Match CREATE TABLE statements and replace data types
  let result = sql;

  // Replace VARCHAR(n) with TEXT
  result = result.replace(/\bVARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT');
  result = result.replace(/\bCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT');
  result = result.replace(/\bCHARACTER\s*\(\s*\d+\s*\)/gi, 'TEXT');
  result = result.replace(/\bNUMERIC\s*(\([^)]*\))?/gi, 'REAL');
  result = result.replace(/\bDECIMAL\s*(\([^)]*\))?/gi, 'REAL');
  result = result.replace(/\bFLOAT4\b/gi, 'REAL');
  result = result.replace(/\bFLOAT8\b/gi, 'REAL');
  result = result.replace(/\bDOUBLE\s+PRECISION\b/gi, 'REAL');
  result = result.replace(/\bTIMESTAMP\s*(\([^)]*\))?\s*(WITH\s+TIME\s+ZONE)?\s*(WITHOUT\s+TIME\s+ZONE)?/gi, 'TEXT');
  result = result.replace(/\bTIMESTAMPTZ\b/gi, 'TEXT');
  result = result.replace(/\bTIME\s*(\([^)]*\))?\s*(WITH\s+TIME\s+ZONE)?\s*(WITHOUT\s+TIME\s+ZONE)?/gi, 'TEXT');
  result = result.replace(/\bDATE\b/gi, 'TEXT');
  result = result.replace(/\bJSONB\b/gi, 'TEXT');
  result = result.replace(/\bJSON\b/gi, 'TEXT');
  result = result.replace(/\bUUID\b/gi, 'TEXT');
  result = result.replace(/\bBYTEA\b/gi, 'BLOB');
  result = result.replace(/\bBOOLEAN\b/gi, 'INTEGER');
  result = result.replace(/\bBOOL\b/gi, 'INTEGER');
  result = result.replace(/\bSERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  result = result.replace(/\bSERIAL\b/gi, 'INTEGER');
  result = result.replace(/\bBIGSERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  result = result.replace(/\bBIGSERIAL\b/gi, 'INTEGER');
  result = result.replace(/\bSMALLSERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  result = result.replace(/\bSMALLSERIAL\b/gi, 'INTEGER');
  result = result.replace(/\bCIDR\b/gi, 'TEXT');
  result = result.replace(/\bINET\b/gi, 'TEXT');
  result = result.replace(/\bMACADDR\b/gi, 'TEXT');
  result = result.replace(/\bINTERVAL\b/gi, 'TEXT');
  result = result.replace(/\bMONEY\b/gi, 'REAL');

  return result;
}
