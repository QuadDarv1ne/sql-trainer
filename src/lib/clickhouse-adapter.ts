/**
 * ClickHouse to SQLite syntax adapter.
 * Transforms ClickHouse-specific SQL syntax into SQLite-compatible syntax.
 */

export function adaptClickHouseToSQLite(sql: string): string {
  let result = sql;

  // Strip SETTINGS clause
  result = result.replace(/\bSETTINGS\s+[^;)]+/gi, '');

  // Strip WITH FILL
  result = result.replace(/\bWITH\s+FILL[^;)]*/gi, '');

  // Strip LIMIT ... WITH TIES → just LIMIT
  result = result.replace(/\bLIMIT\s+[\w\s,]+\s+WITH\s+TIES\b/gi, (match) => {
    const limitMatch = match.match(/LIMIT\s+(\d+)/i);
    return limitMatch ? `LIMIT ${limitMatch[1]}` : match;
  });

  // Replace ENGINE clause in CREATE TABLE
  result = result.replace(/\bENGINE\s*=\s*[^;)]+/gi, '');

  // Replace PRIMARY KEY in ClickHouse (for MergeTree it's separate from column PK)
  result = result.replace(/\bORDER\s+BY\s+tuple\([^)]*\)/gi, '');
  result = result.replace(/\bPARTITION\s+BY\s+[^;)]+/gi, '');

  // Replace ClickHouse data types
  result = replaceClickHouseTypes(result);

  // Replace ClickHouse functions
  result = replaceClickHouseFunctions(result);

  // Replace NULL OR NULL pattern
  result = result.replace(/\bNULL\s+OR\s+NULL\b/g, 'NULL');

  // Replace DEFAULT expressions for ClickHouse types
  result = result.replace(/\bDEFAULT\s+now\(\)/gi, "DEFAULT DATETIME('now')");

  // Replace materialized views - strip MATERIALIZED keyword
  result = result.replace(/\bMATERIALIZED\s+/gi, '');

  // Replace ? operator (null coalescing) - only when used as standalone operator
  result = replaceNullCoalescing(result);

  // Replace DISTINCT ON
  result = result.replace(/\bDISTINCT\s+ON\s*\([^)]+\)/gi, 'DISTINCT');

  // Replace GLOBAL JOIN → just JOIN
  result = result.replace(/\bGLOBAL\s+LEFT\s+JOIN\b/gi, 'LEFT JOIN');
  result = result.replace(/\bGLOBAL\s+RIGHT\s+JOIN\b/gi, 'RIGHT JOIN');
  result = result.replace(/\bGLOBAL\s+INNER\s+JOIN\b/gi, 'INNER JOIN');
  result = result.replace(/\bGLOBAL\s+FULL\s+JOIN\b/gi, 'FULL JOIN');
  result = result.replace(/\bGLOBAL\s+CROSS\s+JOIN\b/gi, 'CROSS JOIN');
  result = result.replace(/\bGLOBAL\s+JOIN\b/gi, 'JOIN');

  // Replace ANY LEFT/INNER JOIN → LEFT/INNER JOIN
  result = result.replace(/\bANY\s+LEFT\s+JOIN\b/gi, 'LEFT JOIN');
  result = result.replace(/\bANY\s+INNER\s+JOIN\b/gi, 'INNER JOIN');

  // Replace ANTI JOIN → LEFT JOIN
  result = result.replace(/\bANTI\s+JOIN\b/gi, 'LEFT JOIN');

  // Replace SEMI JOIN → JOIN
  result = result.replace(/\bSEMI\s+JOIN\b/gi, 'JOIN');
  result = result.replace(/\bLEFT\s+SEMI\s+JOIN\b/gi, 'LEFT JOIN');

  // Replace ARRAY JOIN
  result = result.replace(/\bLEFT\s+ARRAY\s+JOIN\b/gi, 'LEFT JOIN');
  result = result.replace(/\bARRAY\s+JOIN\b/gi, 'JOIN');

  // Replace formatDate
  result = result.replace(/\bformatDate\s*\(/gi, "STRFTIME(");

  // Replace toTypeName
  result = result.replace(/\btoTypeName\s*\([^)]+\)/gi, "'Unknown'");

  // Replace version()
  result = result.replace(/\bversion\s*\(\s*\)/gi, "'22.3'");

  // Replace database()
  result = result.replace(/\bdatabase\s*\(\s*\)/gi, "'default'");

  // Replace rowNumberInAllBlocks / rowNumberInBlock
  result = result.replace(/\browNumberInAllBlocks\s*\(\s*\)/gi, 'ROW_NUMBER() OVER ()');
  result = result.replace(/\browNumberInBlock\s*\(\s*\)/gi, 'ROW_NUMBER() OVER ()');

  return result;
}

function replaceClickHouseTypes(sql: string): string {
  let result = sql;

  // Nullable(type) → type (strip nullable wrapper)
  result = result.replace(/\bNullable\s*\(\s*([^)]+)\s*\)/gi, '$1');

  // LowCardinality(type) → type
  result = result.replace(/\bLowCardinality\s*\(\s*([^)]+)\s*\)/gi, '$1');

  // Simple type replacements
  result = result.replace(/\bUInt8\b/gi, 'INTEGER');
  result = result.replace(/\bUInt16\b/gi, 'INTEGER');
  result = result.replace(/\bUInt32\b/gi, 'INTEGER');
  result = result.replace(/\bUInt64\b/gi, 'INTEGER');
  result = result.replace(/\bUInt128\b/gi, 'INTEGER');
  result = result.replace(/\bUInt256\b/gi, 'INTEGER');
  result = result.replace(/\bInt8\b/gi, 'INTEGER');
  result = result.replace(/\bInt16\b/gi, 'INTEGER');
  result = result.replace(/\bInt32\b/gi, 'INTEGER');
  result = result.replace(/\bInt64\b/gi, 'INTEGER');
  result = result.replace(/\bInt128\b/gi, 'INTEGER');
  result = result.replace(/\bInt256\b/gi, 'INTEGER');
  result = result.replace(/\bFloat32\b/gi, 'REAL');
  result = result.replace(/\bFloat64\b/gi, 'REAL');
  result = result.replace(/\bString\b(?=\s*[,)\s])/gi, 'TEXT');
  result = result.replace(/\bFixedString\s*\(\s*\d+\s*\)/gi, 'TEXT');
  result = result.replace(/\bDate\b(?=\s*[,)\s])/gi, 'TEXT');
  result = result.replace(/\bDateTime\b(?=\s*[,)\s])/gi, 'TEXT');
  result = result.replace(/\bDateTime64\b(?:\(\s*\d+\s*(?:,\s*['"][^'"]+['"])?\s*\))?/gi, 'TEXT');
  result = result.replace(/\bUUID\b/gi, 'TEXT');
  result = result.replace(/\bEnum8\s*\([^)]+\)/gi, 'TEXT');
  result = result.replace(/\bEnum16\s*\([^)]+\)/gi, 'TEXT');
  result = result.replace(/\bIPv4\b/gi, 'TEXT');
  result = result.replace(/\bIPv6\b/gi, 'TEXT');

  // Array(type) → TEXT (simplified)
  result = result.replace(/\bArray\s*\(\s*([^)]+)\s*\)/gi, 'TEXT');

  // Tuple(type, type) → TEXT (simplified)
  result = result.replace(/\bTuple\s*\([^)]+\)/gi, 'TEXT');

  // Map(key, value) → TEXT
  result = result.replace(/\bMap\s*\([^)]+\)/gi, 'TEXT');

  // Nested(...) → TEXT
  result = result.replace(/\bNested\s*\([^)]+\)/gi, 'TEXT');

  // Point → TEXT
  result = result.replace(/\bPoint\b/gi, 'TEXT');

  // Ring → TEXT
  result = result.replace(/\bRing\b/gi, 'TEXT');

  // Polygon → TEXT
  result = result.replace(/\bPolygon\b/gi, 'TEXT');

  // MultiPolygon → TEXT
  result = result.replace(/\bMultiPolygon\b/gi, 'TEXT');

  return result;
}

function replaceClickHouseFunctions(sql: string): string {
  let result = sql;

  // Date/time conversion functions
  result = result.replace(/\btoDate\s*\(/gi, 'DATE(');
  result = result.replace(/\btoDateTime\s*\(/gi, 'DATETIME(');
  result = result.replace(/\btoUnixTimestamp\s*\(\s*now\s*\(\s*\)\s*\)/gi, "CAST(STRFTIME('%s', 'now') AS INTEGER)");

  // Time period functions
  result = result.replace(/\btoStartOfDay\s*\(/gi, 'DATE(');
  result = result.replace(/\btoStartOfWeek\s*\(/gi, 'DATE(');
  result = result.replace(/\btoStartOfMonth\s*\(/gi, 'DATE(');
  result = result.replace(/\btoStartOfQuarter\s*\(/gi, 'DATE(');
  result = result.replace(/\btoStartOfYear\s*\(/gi, 'DATE(');
  result = result.replace(/\btoStartOfISOYear\s*\(/gi, 'DATE(');
  result = result.replace(/\btoISOYear\s*\(/gi, "CAST(STRFTIME('%Y', ");

  // Date formatting
  result = result.replace(/\btoYYYYMM\s*\(/gi, "STRFTIME(");
  result = result.replace(/\btoYYYYMMDD\s*\(/gi, "STRFTIME(");
  result = result.replace(/\btoYYYYMMDDhhmmss\s*\(/gi, "STRFTIME(");

  // now() and today()
  result = result.replace(/\bnow\s*\(\s*\)/gi, "DATETIME('now')");
  result = result.replace(/\btoday\s*\(\s*\)/gi, "DATE('now')");
  result = result.replace(/\byesterday\s*\(\s*\)/gi, "DATE('now', '-1 day')");

  // Type casting functions
  result = result.replace(/\btoUInt8\s*\(/gi, 'CAST(');
  result = result.replace(/\btoUInt16\s*\(/gi, 'CAST(');
  result = result.replace(/\btoUInt32\s*\(/gi, 'CAST(');
  result = result.replace(/\btoUInt64\s*\(/gi, 'CAST(');
  result = result.replace(/\btoInt8\s*\(/gi, 'CAST(');
  result = result.replace(/\btoInt16\s*\(/gi, 'CAST(');
  result = result.replace(/\btoInt32\s*\(/gi, 'CAST(');
  result = result.replace(/\btoInt64\s*\(/gi, 'CAST(');
  result = result.replace(/\btoFloat32\s*\(/gi, 'CAST(');
  result = result.replace(/\btoFloat64\s*\(/gi, 'CAST(');
  result = result.replace(/\btoString\s*\(/gi, 'CAST(');
  result = result.replace(/\btoStringCutToZero\s*\(/gi, 'CAST(');
  result = result.replace(/\btoNullable\s*\(/gi, 'CAST(');

  // Uniq functions
  result = result.replace(/\buniqExact\s*\(/gi, 'COUNT(DISTINCT ');
  result = result.replace(/\buniq\s*\(/gi, 'COUNT(DISTINCT ');

  // Conditional aggregation: sumIf, countIf, avgIf, etc.
  result = replaceConditionalAggregation(result);

  // multiIf(cond1, val1, cond2, val2, ..., elseVal) → CASE WHEN
  result = replaceMultiIf(result);

  // if(cond, then, else) → CASE WHEN
  result = replaceIfFunction(result);

  // empty(string) → LENGTH(COALESCE(string, '')) = 0
  result = result.replace(/\bempty\s*\(\s*([^)]+)\s*\)/gi, "(LENGTH(COALESCE($1, '')) = 0)");
  result = result.replace(/\bempty\s*\(\s*\)/gi, '1');

  // has(array, elem) - simplified
  result = result.replace(/\bhas\s*\(\s*([^,]+),\s*([^)]+)\)/gi, '(INSTR($1, $2) > 0)');

  // arrayJoin
  result = result.replace(/\barrayJoin\s*\(/gi, '(');

  // arrayElement
  result = result.replace(/\barrayElement\s*\(([^,]+),\s*([^)]+)\)/gi, '$1[$2 - 1]');

  // arrayLength
  result = result.replace(/\barrayLength\s*\(/gi, 'LENGTH(CAST(');
  result = result.replace(/\barrayLength\s*\(([^)]+)\)\s*\)/g, 'LENGTH(CAST($1 AS TEXT))');

  // length
  result = result.replace(/\blength\s*\(/gi, 'LENGTH(');

  // concat
  result = result.replace(/\bconcat\s*\(/gi, 'CONCAT(');

  // substring
  result = result.replace(/\bsubstring\s*\(/gi, 'SUBSTR(');

  // lower / upper
  result = result.replace(/\blower\s*\(/gi, 'LOWER(');
  result = result.replace(/\bupper\s*\(/gi, 'UPPER(');

  // trim
  result = result.replace(/\btrimBoth\s*\(/gi, 'TRIM(');
  result = result.replace(/\btrimLeft\s*\(/gi, 'LTRIM(');
  result = result.replace(/\btrimRight\s*\(/gi, 'RTRIM(');

  // replaceOne(s, pattern, replacement)
  result = result.replace(
    /\breplaceOne\s*\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/gi,
    "CASE WHEN INSTR($1, $2) > 0 THEN SUBSTR($1, 1, INSTR($1, $2) - 1) || $3 || SUBSTR($1, INSTR($1, $2) + LENGTH($2)) ELSE $1 END"
  );
  // replaceAll(s, pattern, replacement) → REPLACE
  result = result.replace(/\breplaceAll\s*\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/gi, 'REPLACE($1, $2, $3)');

  // position
  result = result.replace(/\bposition\s*\(([^,]+),\s*([^)]+)\)/gi, 'INSTR($1, $2)');

  // ilike → LIKE
  result = result.replace(/\bilike\b/gi, 'LIKE');
  result = result.replace(/\bnot ilike\b/gi, 'NOT LIKE');
  result = result.replace(/\bnot like\b/gi, 'NOT LIKE');

  // match (regex)
  result = result.replace(/\bmatch\s*\(([^,]+),\s*([^)]+)\)/gi, 'REGEXP($1, $2)');

  // extract year/month/day from date
  result = result.replace(/\btoYear\s*\(/gi, "CAST(STRFTIME('%Y', ");
  result = result.replace(/\btoMonth\s*\(/gi, "CAST(STRFTIME('%m', ");
  result = result.replace(/\btoDayOfMonth\s*\(/gi, "CAST(STRFTIME('%d', ");
  result = result.replace(/\btoDayOfWeek\s*\(/gi, "CAST(STRFTIME('%w', ");
  result = result.replace(/\btoHour\s*\(/gi, "CAST(STRFTIME('%H', ");
  result = result.replace(/\btoMinute\s*\(/gi, "CAST(STRFTIME('%M', ");
  result = result.replace(/\btoSecond\s*\(/gi, "CAST(STRFTIME('%S', ");

  // dateDiff
  result = result.replace(/\bdateDiff\s*\(\s*['"](\w+)['"]\s*,\s*([^,]+),\s*([^)]+)\)/gi, (match, unit, start, end) => {
    const unitLower = unit.toLowerCase();
    switch (unitLower) {
      case 'second':
      case 'seconds':
      case 'ss':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) * 86400 AS INTEGER)`;
      case 'minute':
      case 'minutes':
      case 'mi':
      case 'n':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) * 1440 AS INTEGER)`;
      case 'hour':
      case 'hours':
      case 'hh':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) * 24 AS INTEGER)`;
      case 'day':
      case 'days':
      case 'dd':
        return `CAST(JULIANDAY(${end}) - JULIANDAY(${start}) AS INTEGER)`;
      case 'week':
      case 'weeks':
      case 'ww':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) / 7 AS INTEGER)`;
      case 'month':
      case 'months':
      case 'mm':
      case 'm':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) / 30.4375 AS INTEGER)`;
      case 'quarter':
      case 'quarters':
      case 'qq':
      case 'q':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) / 91.3125 AS INTEGER)`;
      case 'year':
      case 'years':
      case 'yyyy':
      case 'yy':
        return `CAST((JULIANDAY(${end}) - JULIANDAY(${start})) / 365.25 AS INTEGER)`;
      default:
        return `CAST(JULIANDAY(${end}) - JULIANDAY(${start}) AS INTEGER)`;
    }
  });

  // age
  result = result.replace(/\bage\s*\(\s*([^)]+)\)/gi, 'CAST((JULIANDAY(DATE("now")) - JULIANDAY($1)) / 365.25 AS INTEGER)');

  // formatDateTime
  result = result.replace(/\bformatDateTime\s*\(\s*([^,]+),\s*['"]([^'"]+)['"]/gi, (match, expr, fmt) => {
    const chToSqliteFmt = fmt
      .replace(/%T/g, '%H:%M:%S')
      .replace(/%F/g, '%Y-%m-%d')
      .replace(/%R/g, '%H:%M')
      .replace(/%p/g, '');
    return `STRFTIME('${chToSqliteFmt}', ${expr})`;
  });

  // greatest / least
  result = result.replace(/\bgreatest\s*\(/gi, 'MAX(');
  result = result.replace(/\bleast\s*\(/gi, 'MIN(');

  // map
  result = result.replace(/\bmap\s*\(/gi, 'JSON_OBJECT(');

  // tuple
  result = result.replace(/\btuple\s*\(/gi, 'JSON_ARRAY(');

  // hostname
  result = result.replace(/\bhostname\s*\(\s*\)/gi, "'localhost'");

  // bar (visualization) → just return string
  result = result.replace(/\bbar\s*\([^)]+\)/gi, "'█'");

  // concatWithSeparator
  result = result.replace(/\bconcatWithSeparator\s*\([^,]+,\s*/gi, 'GROUP_CONCAT(');

  // groupArray (ClickHouse) → GROUP_CONCAT (SQLite)
  result = result.replace(/\bgroupArray\s*\(\s*DISTINCT\s+([^)]+)\)/gi, 'GROUP_CONCAT(DISTINCT $1)');
  result = result.replace(/\bgroupArray\s*\(([^)]*)\)/gi, 'GROUP_CONCAT($1)');
  result = result.replace(/\bgroupUniqArray\s*\(([^)]*)\)/gi, 'GROUP_CONCAT(DISTINCT $1)');

  // array functions
  result = result.replace(/\barrayConcat\s*\([^,]+,\s*/gi, 'GROUP_CONCAT(');
  result = result.replace(/\barraySort\s*\(/gi, 'GROUP_CONCAT(');
  result = result.replace(/\barrayReverseSort\s*\(/gi, 'GROUP_CONCAT(');

  return result;
}

function replaceConditionalAggregation(sql: string): string {
  let result = sql;

  const patterns = [
    { fn: 'sumIf', defaultVal: '0' },
    { fn: 'avgIf', defaultVal: 'NULL' },
    { fn: 'minIf', defaultVal: 'NULL' },
    { fn: 'maxIf', defaultVal: 'NULL' },
    { fn: 'countIf', defaultVal: '0' },
  ];

  for (const { fn, defaultVal } of patterns) {
    const regex = new RegExp(`\\b${fn}\\s*\\(`, 'gi');
    let match;

    while ((match = regex.exec(result)) !== null) {
      const startIdx = match.index;
      const innerStart = match.index + match[0].length;

      const { endIdx, args } = extractFunctionArgs(result, innerStart);

      if (args.length >= 2) {
        const expr = args[0].trim();
        const cond = args[1].trim();

        let replacement: string;
        if (fn === 'countIf') {
          replacement = `SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END)`;
        } else {
          replacement = `${fn.toUpperCase().replace('IF', '')}(CASE WHEN ${cond} THEN ${expr} ELSE ${defaultVal} END)`;
        }

        result = result.slice(0, startIdx) + replacement + result.slice(endIdx + 1);
        regex.lastIndex = startIdx + replacement.length;
      } else if (args.length === 1) {
        const cond = args[0].trim();
        let replacement: string;
        if (fn === 'countIf') {
          replacement = `SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END)`;
        } else {
          const sqliteFn = fn.toUpperCase().replace('IF', '');
          replacement = `${sqliteFn}(CASE WHEN ${cond} THEN 1 ELSE 0 END)`;
        }
        result = result.slice(0, startIdx) + replacement + result.slice(endIdx + 1);
        regex.lastIndex = startIdx + replacement.length;
      }
    }
  }

  return result;
}

function extractFunctionArgs(sql: string, startIdx: number): { endIdx: number; args: string[] } {
  let depth = 1;
  let i = startIdx;
  let inString = false;
  let stringChar = '';
  const args: string[] = [];
  let currentArg = '';

  while (i < sql.length && depth > 0) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inString) {
      currentArg += ch;
      if (ch === stringChar && next !== stringChar) {
        inString = false;
      } else if (ch === stringChar && next === stringChar) {
        currentArg += next;
        i++;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        currentArg += ch;
      } else if (ch === '(') {
        depth++;
        currentArg += ch;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) {
          args.push(currentArg.trim());
          return { endIdx: i, args };
        }
        currentArg += ch;
      } else if (ch === ',' && depth === 1) {
        args.push(currentArg.trim());
        currentArg = '';
      } else {
        currentArg += ch;
      }
    }
    i++;
  }

  return { endIdx: i - 1, args: [currentArg.trim()] };
}

function replaceNullCoalescing(sql: string): string {
  let result = '';
  let i = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inSingleQuote) {
      result += ch;
      if (ch === "'") {
        if (next === "'") {
          result += next;
          i += 2;
          continue;
        }
        inSingleQuote = false;
      }
      i++;
      continue;
    }

    if (inDoubleQuote) {
      result += ch;
      if (ch === '"') {
        if (next === '"') {
          result += next;
          i += 2;
          continue;
        }
        inDoubleQuote = false;
      }
      i++;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      result += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
      result += ch;
      i++;
      continue;
    }

    // Check for ? surrounded by whitespace
    if (ch === '?' && i > 0 && i < sql.length - 1 && /\s/.test(sql[i - 1]) && /\s/.test(sql[i + 1])) {
      let j = i + 1;
      while (j < sql.length && /\s/.test(sql[j])) j++;
      const nextToken = sql.substring(j, j + 20).match(/^[a-zA-Z_]*/)?.[0]?.toLowerCase() || '';
      const structuralTokens = ['where', 'and', 'or', 'order', 'group', 'having', 'limit', 'offset', 'union', 'from', 'select', 'insert', 'update', 'delete', 'set', 'join', 'on', 'into', 'values', 'create', 'drop', 'alter', 'with', 'as', 'case', 'when', 'then', 'else', 'end', 'not', 'null', 'is', 'in', 'exists', 'between', 'like', 'returning'];
      const nextChar = sql[j] || '';
      const isStructural = structuralTokens.includes(nextToken) || [')', ',', ';'].includes(nextChar);
      if (!isStructural) {
        result += ' COALESCE ';
        i++;
        continue;
      }
    }

    result += ch;
    i++;
  }

  return result;
}

function replaceMultiIf(sql: string): string {
  const regex = /\bmultiIf\s*\(/gi;
  let match;
  let result = sql;

  while ((match = regex.exec(result)) !== null) {
    const startIdx = match.index;
    const innerStart = match.index + match[0].length;
    const { endIdx, args } = extractFunctionArgs(result, innerStart);

    if (args.length >= 2) {
      let caseExpr = 'CASE ';
      for (let i = 0; i < args.length - 1; i += 2) {
        caseExpr += `WHEN ${args[i].trim()} THEN ${args[i + 1].trim()} `;
      }
      if (args.length % 2 === 1) {
        caseExpr += `ELSE ${args[args.length - 1].trim()} `;
      }
      caseExpr += 'END';

      result = result.slice(0, startIdx) + caseExpr + result.slice(endIdx + 1);
      regex.lastIndex = startIdx + caseExpr.length;
    }
  }

  return result;
}

function replaceIfFunction(sql: string): string {
  const regex = /(?:^|[\s,(])if\s*\(/gi;
  let result = sql;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(result)) !== null) {
    const leadingChar = m[0].length > 3 ? m[0][0] : '';
    const startIdx = leadingChar ? m.index + 1 : m.index;
    const innerStart = startIdx + (leadingChar ? m[0].length - 1 : m[0].length);
    const { endIdx, args } = extractFunctionArgs(result, innerStart);

    if (args.length >= 3) {
      const replacement = `CASE WHEN ${args[0].trim()} THEN ${args[1].trim()} ELSE ${args[2].trim()} END`;
      result = result.slice(0, startIdx) + replacement + result.slice(endIdx + 1);
      regex.lastIndex = startIdx + replacement.length;
    } else if (args.length === 2) {
      const replacement = `CASE WHEN ${args[0].trim()} THEN ${args[1].trim()} ELSE NULL END`;
      result = result.slice(0, startIdx) + replacement + result.slice(endIdx + 1);
      regex.lastIndex = startIdx + replacement.length;
    }
  }

  return result;
}
