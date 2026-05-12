/**
 * PostgreSQL to SQLite syntax adapter.
 * Transforms PostgreSQL-specific SQL syntax into SQLite-compatible syntax.
 */

// Map of PostgreSQL data types to SQLite equivalents
const TYPE_MAP: Record<string, string> = {
  'SERIAL': 'INTEGER',
  'BIGSERIAL': 'INTEGER',
  'SMALLSERIAL': 'INTEGER',
  'BOOLEAN': 'INTEGER',
  'BOOL': 'INTEGER',
  'VARCHAR': 'TEXT',
  'CHAR': 'TEXT',
  'CHARACTER': 'TEXT',
  'NUMERIC': 'REAL',
  'DECIMAL': 'REAL',
  'MONEY': 'REAL',
  'FLOAT4': 'REAL',
  'FLOAT8': 'REAL',
  'DOUBLE PRECISION': 'REAL',
  'TIMESTAMP': 'TEXT',
  'TIMESTAMPTZ': 'TEXT',
  'TIME': 'TEXT',
  'TIMETZ': 'TEXT',
  'DATE': 'TEXT',
  'BYTEA': 'BLOB',
  'JSON': 'TEXT',
  'JSONB': 'TEXT',
  'UUID': 'TEXT',
  'CIDR': 'TEXT',
  'INET': 'TEXT',
  'MACADDR': 'TEXT',
  'BIT': 'INTEGER',
  'VARBIT': 'INTEGER',
  'INTERVAL': 'TEXT',
  'TSQUERY': 'TEXT',
  'TSVECTOR': 'TEXT',
};

// PostgreSQL functions to SQLite equivalents
const FUNCTION_MAP: Record<string, string | null> = {
  'STRING_AGG': 'GROUP_CONCAT',
  'CONCAT_WS': 'GROUP_CONCAT', // not perfect but close
  'GENERATE_SERIES': null, // will use recursive CTE
  'ARRAY_AGG': 'GROUP_CONCAT',
  'BOOL_AND': 'MIN', // 0/1 mapping
  'BOOL_OR': 'MAX', // 0/1 mapping
  'DATE_TRUNC': null, // complex, skip
  'EXTRACT': null, // complex, skip
  'CURRENT_DATE': "date('now')",
  'CURRENT_TIME': "time('now')",
  'PG_SLEEP': null, // not supported
};

export function adaptPostgreSQLToSQLite(sql: string): string {
  let result = sql;

  // Replace BOOLEAN DEFAULT TRUE/FALSE
  result = result.replace(/\bDEFAULT\s+TRUE\b/gi, 'DEFAULT 1');
  result = result.replace(/\bDEFAULT\s+FALSE\b/gi, 'DEFAULT 0');
  result = result.replace(/\bTRUE\b/g, '1');
  result = result.replace(/\bFALSE\b/g, '0');

  // Replace ILIKE with LIKE (SQLite LIKE is case-insensitive by default for ASCII)
  result = result.replace(/\bILIKE\b/g, 'LIKE');

  // Replace ::type casting with CAST
  result = result.replace(/::([\w\s]+(\([\d,\s]+\))?)/g, (_, type) => {
    const trimmed = type.trim().toUpperCase();
    const mapped = TYPE_MAP[trimmed] || trimmed;
    return ` AS ${mapped}`;
  });

  // Replace STRING_AGG(expr, delimiter) with GROUP_CONCAT(expr, delimiter)
  result = result.replace(
    /\bSTRING_AGG\s*\(([^,]+),\s*([^)]+)\)/gi,
    (_, expr, delim) => `GROUP_CONCAT(${expr.trim()}, ${delim.trim()})`
  );

  // Replace ARRAY_AGG with GROUP_CONCAT
  result = result.replace(
    /\bARRAY_AGG\s*\(([^)]+)\)/gi,
    'GROUP_CONCAT($1)'
  );

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
