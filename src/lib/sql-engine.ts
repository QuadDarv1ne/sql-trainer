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
  suggestion?: string;
  explainPlan?: string;
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

    // Handle block comments
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
      if (char === '\n') {
        inComment = false;
      }
      continue;
    }

    if (char === '/' && next === '*' && !inString) {
      inBlockComment = true;
      current += char;
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
        // Check for escaped quote
        if (next === stringChar) {
          i++;
          current += next;
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

function isSelectQuery(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return (
    trimmed.startsWith('SELECT') ||
    trimmed.startsWith('PRAGMA') ||
    trimmed.startsWith('EXPLAIN') ||
    trimmed.startsWith('WITH')
  );
}

function isDDL(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
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
function getSuggestionForError(error: string, sql: string): string | undefined {
  const lowerError = error.toLowerCase();

  // Common SQL errors and suggestions
  if (lowerError.includes('no such table')) {
    const match = error.match(/no such table: (\w+)/i);
    if (match) {
      return `Таблица "${match[1]}" не существует. Проверьте название таблицы в FROM или JOIN.`;
    }
    return 'Проверьте название таблицы — возможно, она не существует.';
  }

  if (lowerError.includes('no such column')) {
    const match = error.match(/no such column: (\w+)/i);
    if (match) {
      return `Столбец "${match[1]}" не найден. Проверьте имя столбца или используйте алиас таблицы.`;
    }
    return 'Проверьте имя столбца — возможно, оно написано неверно.';
  }

  if (lowerError.includes('ambiguous column name')) {
    return 'Имя столбца найдено в нескольких таблицах. Используйте алиас.таблица (например, e.name вместо name).';
  }

  if (lowerError.includes('syntax error') && lowerError.includes('near')) {
    return 'Проверьте синтаксис запроса. Возможно, пропущена запятая, скобка или ключевое слово.';
  }

  if (lowerError.includes('aggregate function')) {
    return 'Агрегатные функции (COUNT, SUM, AVG, etc.) нельзя использовать в WHERE. Используйте HAVING для фильтрации агрегатов.';
  }

  if (lowerError.includes('group by')) {
    return 'Все столбцы в SELECT (кроме агрегатных) должны быть в GROUP BY.';
  }

  if (lowerError.includes('unique constraint failed') || lowerError.includes('primary key')) {
    return 'Нарушено ограничение уникальности. Возможно, вы пытаетесь вставить дублирующийся ключ.';
  }

  if (lowerError.includes('foreign key constraint failed')) {
    return 'Нарушено ограничение внешнего ключа. Убедитесь, что связанные записи существуют.';
  }

  if (lowerError.includes('cannot add foreign key')) {
    return 'Не удалось добавить внешний ключ. Проверьте, что типы столбцов совпадают в обеих таблицах.';
  }

  if (lowerError.includes('order by')) {
    return 'Проверьте порядок сортировки. ORDER BY должен быть после WHERE/GROUP BY/HAVING.';
  }

  if (lowerError.includes('limit')) {
    return 'LIMIT должен быть последним в запросе (после ORDER BY).';
  }

  if (lowerError.includes('union') && lowerError.includes('different number')) {
    return 'Все запросы в UNION должны иметь одинаковое количество столбцов.';
  }

  if (lowerError.includes('subquery returned more than one row')) {
    return 'Подзапрос вернул несколько строк. Используйте IN, EXISTS или добавьте LIMIT 1.';
  }

  if (lowerError.includes('division by zero')) {
    return 'Деление на ноль. Используйте NULLIF или CASE для избежания деления на ноль.';
  }

  if (lowerError.includes('case') && lowerError.includes('end')) {
    return 'Проверьте синтаксис CASE WHEN ... THEN ... ELSE ... END.';
  }

  if (lowerError.includes('window function')) {
    return 'Оконные функции требуют OVER(). Например: ROW_NUMBER() OVER (ORDER BY column).';
  }

  if (lowerError.includes('partition by')) {
    return 'PARTITION BY используется внутри OVER(). Например: OVER (PARTITION BY column ORDER BY column).';
  }

  if (lowerError.includes('trigger')) {
    return 'Проверьте синтаксис CREATE TRIGGER. Триггеры выполняются автоматически при INSERT/UPDATE/DELETE.';
  }

  if (lowerError.includes('transaction')) {
    return 'Транзакция: BEGIN начинает, COMMIT фиксирует, ROLLBACK отменяет изменения.';
  }

  if (lowerError.includes('fts') || lowerError.includes('match')) {
    return 'FTS5 поиск: используйте MATCH для полнотекстового поиска. Например: WHERE table MATCH "слово".';
  }

  if (lowerError.includes('json')) {
    return 'JSON функции: json_extract(data, "$.field") извлекает значение из JSON.';
  }

  if (lowerError.includes('date') || lowerError.includes('time')) {
    return 'Даты в SQLite: strftime("%Y", date), julianday(date1) - julianday(date2).';
  }

  return undefined;
}

/** Maximum number of rows returned by a query */
const MAX_ROWS = 1000;

/**
 * Execute prepared statements against an already-initialized database.
 * Shared logic between executeQuery and executeWithSchema.
 */
function executeStatements(
  db: Database.Database,
  statements: string[],
  startTime: number
): QueryResult {
  let lastResult: QueryResult | null = null;

  for (const stmt of statements) {
    try {
      if (isSelectQuery(stmt)) {
        const statement = db.prepare(stmt);
        const columns = statement.columns().map((col) => col.name);
        let rows = statement.all() as Record<string, unknown>[];

        // Enforce row limit
        const truncated = rows.length > MAX_ROWS;
        if (truncated) {
          rows = rows.slice(0, MAX_ROWS);
        }

        lastResult = {
          success: true,
          columns,
          rows,
          executionTime: performance.now() - startTime,
          message: truncated
            ? `Результат ограничен ${MAX_ROWS} строками`
            : undefined,
        };
      } else if (isDDL(stmt)) {
        db.exec(stmt);
        lastResult = {
          success: true,
          columns: [],
          rows: [],
          executionTime: performance.now() - startTime,
          message: 'Операция DDL выполнена успешно',
        };
      } else {
        const statement = db.prepare(stmt);
        const result = statement.run();
        if (lastResult) {
          const prev: QueryResult = lastResult;
          lastResult = {
            ...prev,
            executionTime: performance.now() - startTime,
            affectedRows: result.changes,
          };
        } else {
          lastResult = {
            success: true,
            columns: [],
            rows: [],
            executionTime: performance.now() - startTime,
            message: `Запрос выполнен. Изменено строк: ${result.changes}`,
            affectedRows: result.changes,
          };
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        columns: [],
        rows: [],
        error: errorMsg,
        executionTime: performance.now() - startTime,
        suggestion: getSuggestionForError(errorMsg, stmt),
      };
    }
  }

  if (lastResult) return lastResult;

  return {
    success: true,
    columns: [],
    rows: [],
    executionTime: performance.now() - startTime,
    message: 'Запрос выполнен успешно',
  };
}

export function executeQuery(
  sql: string,
  dbType: 'sqlite' | 'postgresql' = 'sqlite'
): QueryResult {
  const startTime = performance.now();
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    let processedSql = sql;
    if (dbType === 'postgresql') {
      processedSql = adaptPostgreSQLToSQLite(sql);
    }

    const statements = splitStatements(processedSql);
    const result = executeStatements(db, statements, startTime);
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
  dbType: 'sqlite' | 'postgresql' = 'sqlite'
): QueryResult {
  const startTime = performance.now();
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    let processedSchema = schemaSql;
    if (dbType === 'postgresql') {
      processedSchema = adaptPostgreSQLToSQLite(schemaSql);
    }

    try {
      db.exec(processedSchema);
    } catch (schemaErr: unknown) {
      const msg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
      return {
        success: false,
        columns: [],
        rows: [],
        error: `Ошибка создания схемы: ${msg}`,
        executionTime: performance.now() - startTime,
      };
    }

    let processedSql = sql;
    if (dbType === 'postgresql') {
      processedSql = adaptPostgreSQLToSQLite(sql);
    }

    const statements = splitStatements(processedSql);
    return executeStatements(db, statements, startTime);
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
  dbType: 'sqlite' | 'postgresql' = 'sqlite'
): { success: boolean; plan?: string; error?: string } {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  try {
    let processedSchema = schemaSql;
    if (dbType === 'postgresql') {
      processedSchema = adaptPostgreSQLToSQLite(schemaSql);
    }

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
