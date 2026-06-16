/**
 * MySQL to SQLite Adapter.
 * Translates MySQL-specific SQL syntax to SQLite-compatible syntax.
 */

/**
 * Map MySQL data types to SQLite equivalents.
 */
const TYPE_MAP: Record<string, string> = {
  TINYINT: 'INTEGER',
  SMALLINT: 'INTEGER',
  MEDIUMINT: 'INTEGER',
  INT: 'INTEGER',
  INTEGER: 'INTEGER',
  BIGINT: 'INTEGER',
  FLOAT: 'REAL',
  DOUBLE: 'REAL',
  DECIMAL: 'REAL',
  NUMERIC: 'REAL',
  BIT: 'INTEGER',
  BOOLEAN: 'INTEGER',
  BOOL: 'INTEGER',
  DATE: 'TEXT',
  DATETIME: 'TEXT',
  TIMESTAMP: 'TEXT',
  TIME: 'TEXT',
  YEAR: 'INTEGER',
  CHAR: 'TEXT',
  VARCHAR: 'TEXT',
  TINYTEXT: 'TEXT',
  TEXT: 'TEXT',
  MEDIUMTEXT: 'TEXT',
  LONGTEXT: 'TEXT',
  BINARY: 'BLOB',
  VARBINARY: 'BLOB',
  TINYBLOB: 'BLOB',
  BLOB: 'BLOB',
  MEDIUMBLOB: 'BLOB',
  LONGBLOB: 'BLOB',
  JSON: 'TEXT',
  ENUM: 'TEXT',
  SET: 'TEXT',
  GEOMETRY: 'TEXT',
  POINT: 'TEXT',
  LINESTRING: 'TEXT',
  POLYGON: 'TEXT',
};

/**
 * Detect which MySQL functions were dropped during adaptation.
 */
export function detectDroppedFunctions(originalSql: string): string[] {
  const dropped: string[] = [];

  // Functions that are NOT adapted (should be reported as dropped if present in original)
  const unadaptedFunctions = [
    'LOAD_FILE',
    'INET_ATON',
    'INET_NTOA',
    'INET6_ATON',
    'INET6_NTOA',
    'CAST',
    'CONVERT',
    'BINARY',
    'CASE',
    'NULLIF',
    'GET_LOCK',
    'RELEASE_LOCK',
    'IS_FREE_LOCK',
    'IS_USED_LOCK',
    'BENCHMARK',
    'SLEEP',
    'MD5',
    'SHA1',
    'SHA2',
    'PASSWORD',
    'ENCRYPT',
    'DECODE',
    'ENCODE',
    'AES_ENCRYPT',
    'AES_DECRYPT',
    'COMPRESS',
    'UNCOMPRESS',
    'UNCOMPRESSED_LENGTH',
  ];

  for (const func of unadaptedFunctions) {
    const regex = new RegExp(`\\b${func}\\s*\\(`, 'i');
    if (regex.test(originalSql)) {
      dropped.push(func);
    }
  }

  return dropped;
}

/**
 * Adapt a single MySQL function call to SQLite.
 */
function adaptFunction(sql: string): string {
  let result = sql;

  // IF(condition, true_val, false_val) -> CASE WHEN condition THEN true_val ELSE false_val END
  result = result.replace(/\bIF\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, 'CASE WHEN $1 THEN $2 ELSE $3 END');

  // DATE_FORMAT(date, format) -> strftime adapted
  result = result.replace(/\bDATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d'\s*\)/gi, 'date($1)');
  result = result.replace(/\bDATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d %H:%i:%s'\s*\)/gi, 'datetime($1)');
  result = result.replace(/\bDATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%H:%i:%s'\s*\)/gi, 'time($1)');
  result = result.replace(/\bDATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y'\s*\)/gi, "strftime('%Y', $1)");
  result = result.replace(/\bDATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%m'\s*\)/gi, "strftime('%m', $1)");
  result = result.replace(/\bDATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%d'\s*\)/gi, "strftime('%d', $1)");

  // STR_TO_DATE(str, format) -> date(str) or datetime(str)
  result = result.replace(/\bSTR_TO_DATE\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d'\s*\)/gi, 'date($1)');
  result = result.replace(/\bSTR_TO_DATE\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d %H:%i:%s'\s*\)/gi, 'datetime($1)');

  // DATE_ADD(date, INTERVAL n DAY/HOUR/MINUTE/SECOND)
  result = result.replace(/\bDATE_ADD\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "date($1, '+$2 days')");
  result = result.replace(
    /\bDATE_ADD\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+HOUR\s*\)/gi,
    "datetime($1, '+$2 hours')",
  );
  result = result.replace(
    /\bDATE_ADD\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+MINUTE\s*\)/gi,
    "datetime($1, '+$2 minutes')",
  );
  result = result.replace(
    /\bDATE_ADD\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+SECOND\s*\)/gi,
    "datetime($1, '+$2 seconds')",
  );

  // DATE_SUB(date, INTERVAL n DAY/HOUR/MINUTE/SECOND)
  result = result.replace(/\bDATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "date($1, '-$2 days')");
  result = result.replace(
    /\bDATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+HOUR\s*\)/gi,
    "datetime($1, '-$2 hours')",
  );
  result = result.replace(
    /\bDATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+MINUTE\s*\)/gi,
    "datetime($1, '-$2 minutes')",
  );
  result = result.replace(
    /\bDATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+SECOND\s*\)/gi,
    "datetime($1, '-$2 seconds')",
  );

  // DATEDIFF(date1, date2) -> julianday difference
  result = result.replace(
    /\bDATEDIFF\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    'CAST(julianday($1) - julianday($2) AS INTEGER)',
  );

  // TIMESTAMPDIFF(unit, date1, date2)
  result = result.replace(
    /\bTIMESTAMPDIFF\s*\(\s*SECOND\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    'CAST((julianday($2) - julianday($1)) * 86400 AS INTEGER)',
  );
  result = result.replace(
    /\bTIMESTAMPDIFF\s*\(\s*MINUTE\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    'CAST((julianday($2) - julianday($1)) * 1440 AS INTEGER)',
  );
  result = result.replace(
    /\bTIMESTAMPDIFF\s*\(\s*HOUR\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    'CAST((julianday($2) - julianday($1)) * 24 AS INTEGER)',
  );
  result = result.replace(
    /\bTIMESTAMPDIFF\s*\(\s*DAY\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    'CAST(julianday($2) - julianday($1) AS INTEGER)',
  );

  // CONCAT_WS(separator, ...) is supported by SQLite as is

  // FIELD(value, val1, val2, ...) -> CASE WHEN
  result = result.replace(
    /\bFIELD\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/gi,
    'CASE $1 WHEN $2 THEN 1 WHEN $3 THEN 2 ELSE 3 END',
  );

  // FIND_IN_SET(str, strlist) -> LIKE
  result = result.replace(
    /\bFIND_IN_SET\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
    "(CASE WHEN ',' || $2 || ',' LIKE '%,' || $1 || ',%' THEN 1 ELSE 0 END)",
  );

  // REGEXP/RLIKE -> SQLite doesn't support regex natively, use LIKE approximation
  result = result.replace(/\b([^,\s]+)\s+REGEXP\s+([^,\s]+)/gi, '$1 LIKE $2');
  result = result.replace(/\bRLIKE\s+([^,\s]+)/gi, 'LIKE $1');

  return result;
}

/**
 * Adapt MySQL data types in CREATE TABLE statements.
 */
function adaptDataTypes(sql: string): string {
  let result = sql;

  // Replace MySQL data types with SQLite equivalents
  // Use negative lookahead to avoid matching DATE in DATE_FORMAT, DATE_ADD, etc.
  // Note: We only exclude letters/underscore, not parentheses, so TINYINT(1) still matches
  for (const [mysqlType, sqliteType] of Object.entries(TYPE_MAP)) {
    // Skip SET type when it appears in comment form (-- SET NAMES removed)
    if (mysqlType === 'SET') {
      // Only convert SET when followed by parenthesis (ENUM-like usage)
      result = result.replace(/\bSET\s*\(/gi, 'TEXT(');
    } else if (['DATE', 'TIME', 'TIMESTAMP', 'DATETIME'].includes(mysqlType)) {
      // Don't convert these types when they're part of date(), time(), datetime() functions
      const regex = new RegExp(`\\b${mysqlType}(?![_a-zA-Z(])(?:\\s*\\([^)]*\\))?`, 'gi');
      result = result.replace(regex, () => sqliteType);
    } else {
      const regex = new RegExp(`\\b${mysqlType}(?![_a-zA-Z])(?:\\s*\\([^)]*\\))?`, 'gi');
      result = result.replace(regex, () => sqliteType);
    }
  }

  // Handle VARCHAR(n) -> TEXT
  result = result.replace(/\bVARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT');

  // Handle CHAR(n) -> TEXT
  result = result.replace(/\bCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT');

  // Handle INT(n) -> INTEGER (display width is MySQL-specific)
  result = result.replace(/\bINT\s*\(\s*\d+\s*\)/gi, 'INTEGER');

  // Handle DECIMAL(p,s) -> REAL
  result = result.replace(/\bDECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'REAL');

  // Handle DOUBLE(p,s) -> REAL
  result = result.replace(/\bDOUBLE\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'REAL');

  // Handle ENUM('val1','val2',...) -> TEXT
  result = result.replace(/\bENUM\s*\([^)]*\)/gi, 'TEXT');

  // Handle SET('val1','val2',...) -> TEXT
  result = result.replace(/\bSET\s*\([^)]*\)/gi, 'TEXT');

  // AUTO_INCREMENT -> AUTOINCREMENT
  result = result.replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT');

  // UNSIGNED/ZEROFILL modifiers -> remove
  result = result.replace(/\bUNSIGNED\b/gi, '');
  result = result.replace(/\bZEROFILL\b/gi, '');

  return result;
}

/**
 * Adapt MySQL-specific clauses and syntax.
 */
function adaptClauses(sql: string): string {
  let result = sql;

  // USE database -> comment out (SQLite doesn't support USE)
  result = result.replace(/^\s*USE\s+\w+\s*;?/gim, '-- USE statement removed');

  // SET NAMES utf8 -> comment out
  result = result.replace(/^\s*SET\s+NAMES\s+\w+\s*;?/gim, '-- SET NAMES removed');

  // SHOW TABLES -> SELECT name FROM sqlite_master WHERE type='table'
  result = result.replace(/^\s*SHOW\s+TABLES\s*;?/gim, "SELECT name FROM sqlite_master WHERE type='table'");

  // SHOW DATABASES -> SELECT name FROM sqlite_master WHERE type='table'
  result = result.replace(/^\s*SHOW\s+DATABASES\s*;?/gim, "SELECT name FROM sqlite_master WHERE type='table'");

  // DESCRIBE table -> PRAGMA table_info(table)
  result = result.replace(/^\s*DESCRIBE\s+(\w+)\s*;?/gim, 'PRAGMA table_info($1)');

  // EXPLAIN -> keep as is (SQLite supports EXPLAIN)

  // Backtick identifiers -> remove (SQLite uses double quotes or no quotes)
  result = result.replace(/`([^`]+)`/g, '"$1"');

  // STRAIGHT_JOIN -> JOIN
  result = result.replace(/\bSTRAIGHT_JOIN\b/gi, 'JOIN');

  // SQL_NO_CACHE, SQL_CACHE -> remove (SQLite doesn't use query cache)
  result = result.replace(/\bSQL_NO_CACHE\b/gi, '');
  result = result.replace(/\bSQL_CACHE\b/gi, '');

  // HIGH_PRIORITY, LOW_PRIORITY, DELAYED -> remove
  result = result.replace(/\bHIGH_PRIORITY\b/gi, '');
  result = result.replace(/\bLOW_PRIORITY\b/gi, '');
  result = result.replace(/\bDELAYED\b/gi, '');

  // IGNORE -> keep (SQLite has similar behavior)

  // ON DUPLICATE KEY UPDATE -> SQLite uses INSERT OR REPLACE/INSERT OR IGNORE
  // This is complex, just remove for now
  result = result.replace(/\bON\s+DUPLICATE\s+KEY\s+UPDATE\s+.+$/gim, '');

  return result;
}

/**
 * Main function to adapt MySQL SQL to SQLite.
 */
export function adaptMySQLToSQLite(sql: string): string {
  let result = sql;

  // Adapt clauses first
  result = adaptClauses(result);

  // Adapt functions BEFORE data types (so DATE_FORMAT etc. are converted before DATE→TEXT)
  result = adaptFunction(result);

  // Adapt data types last
  result = adaptDataTypes(result);

  return result;
}

/**
 * Adapt MySQL SQL to SQLite with warnings about dropped functions.
 */
export function adaptMySQLWithWarnings(sql: string): { sql: string; warnings: string[] } {
  const adaptedSql = adaptMySQLToSQLite(sql);
  const droppedFunctions = detectDroppedFunctions(sql);

  const warnings: string[] = [];
  if (droppedFunctions.length > 0) {
    warnings.push(`The following MySQL functions are not supported in SQLite: ${droppedFunctions.join(', ')}`);
  }

  return { sql: adaptedSql, warnings };
}
