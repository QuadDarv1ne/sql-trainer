import { describe, it, expect, vi } from 'vitest';

// Check if better-sqlite3 native bindings are available before test collection
const sqliteAvailable = vi.hoisted(() => {
  try {
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.exec('SELECT 1');
    db.close();
    return true;
  } catch {
    return false;
  }
});

const describeIf = sqliteAvailable ? describe : describe.skip;

import { executeQuery, executeWithSchema, executeWithSchemaMulti, getSchemaInfo, explainQuery, splitStatements } from '@/lib/sql-engine';

describeIf('sql-engine', () => {
  describe('splitStatements', () => {
    it('should split statements on semicolons', () => {
      const sql = "SELECT 1; SELECT 2;";
      expect(splitStatements(sql)).toEqual(['SELECT 1', 'SELECT 2']);
    });

    it('should not split inside single-quoted strings', () => {
      const sql = "SELECT 'hello; world' as val";
      expect(splitStatements(sql)).toEqual(["SELECT 'hello; world' as val"]);
    });

    it('should handle escaped quotes with doubled single quotes', () => {
      const sql = "SELECT 'it''s fine; done' as val";
      expect(splitStatements(sql)).toEqual(["SELECT 'it''s fine; done' as val"]);
    });

    it('should handle backslash-escaped quotes without splitting', () => {
      const sql = "SELECT 'it\\'; done' as val";
      const result = splitStatements(sql);
      expect(result).toHaveLength(1);
      // Backslash is preserved in the output
      expect(result[0]).toContain("\\'");
    });

    it('should handle multiple statements with backslash-escaped quotes', () => {
      const sql = "SELECT 'a\\'; b'; SELECT 2;";
      const result = splitStatements(sql);
      expect(result).toHaveLength(2);
    });

    it('should preserve backslashes in file paths', () => {
      const sql = "SELECT 'C:\\\\path\\\\to\\\\file' as path";
      const result = splitStatements(sql);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('\\\\');
    });
  });

  describe('executeQuery - DML after SELECT', () => {
    it('should return DML result when INSERT follows SELECT', () => {
      const sql = `
        CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO test VALUES (1, 'Alice');
        SELECT * FROM test;
        INSERT INTO test VALUES (2, 'Bob');
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
    });

    it('should return SELECT result when it is the last statement', () => {
      const sql = `
        CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO test VALUES (1, 'Alice');
        INSERT INTO test VALUES (2, 'Bob');
        SELECT * FROM test;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
      expect(result.columns).toEqual(['id', 'name']);
      expect(result.affectedRows).toBeUndefined();
    });

    it('should return DDL message when DDL is the last statement', () => {
      const sql = `
        CREATE TABLE test (id INTEGER PRIMARY KEY);
        INSERT INTO test VALUES (1);
        DROP TABLE test;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Операция DDL выполнена успешно');
      expect(result.rows).toEqual([]);
    });
  });

  describe('executeQuery - comment handling', () => {
    it('should execute SELECT after leading comments', () => {
      const sql = `
        -- This is a comment
        /* Another comment */
        SELECT 1 as val;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.rows).toEqual([{ val: 1 }]);
    });

    it('should handle inline comments in SELECT', () => {
      const sql = `SELECT /* inline comment */ 1 as val`;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.rows).toEqual([{ val: 1 }]);
    });

    it('should handle multiline block comments before SELECT', () => {
      const sql = `
        /*
         * Multi-line comment
         */
        SELECT 42 as num;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.rows).toEqual([{ num: 42 }]);
    });
  });

  describe('executeWithSchema', () => {
    it('should execute query with schema and return correct results', () => {
      const schema = `
        CREATE TABLE employees (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          department TEXT
        );
        INSERT INTO employees VALUES (1, 'Alice', 'Engineering');
        INSERT INTO employees VALUES (2, 'Bob', 'Sales');
      `;
      const query = `SELECT * FROM employees WHERE department = 'Engineering'`;
      const result = executeWithSchema(query, schema);
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({
        id: 1,
        name: 'Alice',
        department: 'Engineering',
      });
    });
  });

  describe('executeWithSchema - PostgreSQL adapter', () => {
    it('should handle PostgreSQL :: casting in SELECT', () => {
      const schema = `
        CREATE TABLE employees (id INTEGER PRIMARY KEY, salary TEXT);
        INSERT INTO employees VALUES (1, '50000');
      `;
      const query = "SELECT salary::INTEGER as salary_num FROM employees";
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].salary_num).toBe(50000);
    });

    it('should handle ILIKE operator (case-insensitive matching)', () => {
      const schema = `
        CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO products VALUES (1, 'Apple');
        INSERT INTO products VALUES (2, 'banana');
      `;
      const query = "SELECT * FROM products WHERE name ILIKE 'apple'";
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Apple');
    });

    it('should handle PostgreSQL SERIAL data type in schema', () => {
      const schema = `
        CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));
        INSERT INTO users (name) VALUES ('Alice');
        INSERT INTO users (name) VALUES ('Bob');
      `;
      const query = 'SELECT * FROM users';
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('Alice');
    });

    it('should handle PostgreSQL BOOLEAN data type with DEFAULT TRUE/FALSE', () => {
      const schema = `
        CREATE TABLE settings (id INTEGER PRIMARY KEY, active BOOLEAN DEFAULT TRUE, deleted BOOLEAN DEFAULT FALSE);
        INSERT INTO settings (id) VALUES (1);
      `;
      const query = 'SELECT active, deleted FROM settings';
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].active).toBe(1);
      expect(result.rows[0].deleted).toBe(0);
    });

    it('should handle PostgreSQL NOW() function', () => {
      const schema = `CREATE TABLE logs (id INTEGER PRIMARY KEY, created_at TEXT)`;
      const query = "SELECT NOW() as current_time";
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      // NOW() is replaced with datetime('now') which returns a datetime string
      expect(result.rows[0].current_time).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should handle SUBSTRING function (replaced with SUBSTR)', () => {
      const schema = `
        CREATE TABLE names (id INTEGER PRIMARY KEY, full_name TEXT);
        INSERT INTO names VALUES (1, 'John Doe');
      `;
      const query = "SELECT SUBSTRING(full_name, 1, 4) as short_name FROM names";
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows[0].short_name).toBe('John');
    });

    it('should handle IS TRUE / IS FALSE syntax', () => {
      const schema = `
        CREATE TABLE flags (id INTEGER PRIMARY KEY, active INTEGER);
        INSERT INTO flags VALUES (1, 1);
        INSERT INTO flags VALUES (2, 0);
      `;
      const query = 'SELECT * FROM flags WHERE active IS TRUE';
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(1);
    });

    it('should handle DISTINCT ON (removed, falls back to DISTINCT)', () => {
      const schema = `
        CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, amount INTEGER);
        INSERT INTO orders VALUES (1, 'Alice', 100);
        INSERT INTO orders VALUES (2, 'Alice', 200);
        INSERT INTO orders VALUES (3, 'Bob', 150);
      `;
      const query = 'SELECT DISTINCT ON (customer) customer, amount FROM orders ORDER BY customer, amount DESC';
      const result = executeWithSchema(query, schema, 'postgresql');
      // DISTINCT ON is removed, query should still execute with DISTINCT
      expect(result.success).toBe(true);
    });

    it('should handle LIMIT ALL', () => {
      const schema = `
        CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO items VALUES (1, 'A');
        INSERT INTO items VALUES (2, 'B');
        INSERT INTO items VALUES (3, 'C');
      `;
      const query = 'SELECT * FROM items LIMIT ALL';
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(3);
    });

    it('should handle RETURNING clause in INSERT', () => {
      const schema = `
        CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
      `;
      const query = "INSERT INTO products (name, price) VALUES ('Widget', 9.99) RETURNING id, name";
      const result = executeWithSchema(query, schema, 'postgresql');
      // RETURNING is stripped, should still insert successfully
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should handle multiple PostgreSQL syntax features in one query', () => {
      const schema = `
        CREATE TABLE employees (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          department TEXT,
          salary NUMERIC,
          active BOOLEAN DEFAULT TRUE
        );
        INSERT INTO employees (name, department, salary) VALUES ('Alice', 'Engineering', 80000);
        INSERT INTO employees (name, department, salary) VALUES ('Bob', 'Sales', 60000);
        INSERT INTO employees (name, department, salary) VALUES ('Charlie', 'Engineering', 75000);
      `;
      const query = `
        SELECT name, salary::INTEGER as salary_int
        FROM employees
        WHERE department ILIKE 'engineering' AND active IS TRUE
        ORDER BY salary DESC
      `;
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('Alice');
      expect(result.rows[0].salary_int).toBe(80000);
      expect(result.rows[1].name).toBe('Charlie');
    });

    it('should warn about unsupported functions', () => {
      const schema = `CREATE TABLE test (id INTEGER PRIMARY KEY, val TEXT)`;
      const query = 'SELECT DATE_TRUNC("month", NOW()) as month_start FROM test';
      const result = executeWithSchema(query, schema, 'postgresql');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('DATE_TRUNC'))).toBe(true);
    });
  });

  describe('executeQuery - validation', () => {
    it('should reject empty input', () => {
      const result = executeQuery('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject whitespace-only input', () => {
      const result = executeQuery('   \n\t  ');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow DROP TABLE statements', () => {
      const schema = `CREATE TABLE temp_table (id INTEGER PRIMARY KEY)`;
      const result = executeQuery(`${schema}; DROP TABLE temp_table;`);
      expect(result.success).toBe(true);
    });
  });

  describe('executeQuery - DDL operations', () => {
    it('should create a table and return DDL success message', () => {
      const result = executeQuery('CREATE TABLE test_ddl (id INTEGER PRIMARY KEY, name TEXT)');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Операция DDL выполнена успешно');
      expect(result.columns).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should alter a table successfully', () => {
      const sql = `
        CREATE TABLE test_alter (id INTEGER PRIMARY KEY);
        ALTER TABLE test_alter ADD COLUMN email TEXT;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Операция DDL выполнена успешно');
    });

    it('should truncate a table', () => {
      const sql = `
        CREATE TABLE test_truncate (id INTEGER PRIMARY KEY);
        INSERT INTO test_truncate VALUES (1);
        DELETE FROM test_truncate;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
    });
  });

  describe('executeQuery - DML operations', () => {
    it('should insert rows and report affectedRows', () => {
      const sql = `
        CREATE TABLE test_dml (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO test_dml VALUES (1, 'Alice');
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
      expect(result.message).toContain('1');
    });

    it('should update rows and report affectedRows', () => {
      const sql = `
        CREATE TABLE test_update (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO test_update VALUES (1, 'Alice'), (2, 'Bob');
        UPDATE test_update SET name = 'Charlie' WHERE id = 1;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
    });

    it('should delete rows and report affectedRows', () => {
      const sql = `
        CREATE TABLE test_delete (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO test_delete VALUES (1, 'Alice'), (2, 'Bob');
        DELETE FROM test_delete WHERE id = 1;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
    });
  });

  describe('executeQuery - error handling and suggestions', () => {
    it('should suggest table does not exist', () => {
      const result = executeQuery('SELECT * FROM nonexistent_table');
      expect(result.success).toBe(false);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('nonexistent_table');
    });

    it('should suggest column not found', () => {
      const sql = `
        CREATE TABLE test_col_err (id INTEGER PRIMARY KEY);
        SELECT nonexistent_col FROM test_col_err;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(false);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('nonexistent_col');
    });

    it('should handle syntax errors gracefully', () => {
      const result = executeQuery('SELEC * FROM test');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unique constraint violation', () => {
      const sql = `
        CREATE TABLE test_unique (id INTEGER PRIMARY KEY);
        INSERT INTO test_unique VALUES (1);
        INSERT INTO test_unique VALUES (1);
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(false);
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('executeQuery - WITH and PRAGMA', () => {
    it('should execute WITH (CTE) queries', () => {
      const result = executeQuery("WITH cte AS (SELECT 1 as val) SELECT * FROM cte");
      expect(result.success).toBe(true);
      expect(result.rows).toEqual([{ val: 1 }]);
    });

    it('should execute PRAGMA queries', () => {
      const result = executeQuery('PRAGMA table_list');
      expect(result.success).toBe(true);
      expect(result.columns).toBeDefined();
    });
  });

  describe('executeQuery - MySQL adapter', () => {
    it('should handle MySQL backtick identifiers', () => {
      const schema = `CREATE TABLE test_mysql (\`id\` INTEGER PRIMARY KEY, \`name\` TEXT)`;
      const query = 'SELECT `name` FROM test_mysql';
      const result = executeWithSchema(query, schema, 'mysql');
      expect(result.success).toBe(true);
    });

    it('should handle MySQL IFNULL function', () => {
      const schema = `CREATE TABLE test_ifnull (id INTEGER PRIMARY KEY, val TEXT)`;
      const query = "SELECT IFNULL(val, 'default') as result FROM test_ifnull";
      const result = executeWithSchema(query, schema, 'mysql');
      expect(result.success).toBe(true);
    });
  });

  describe('executeQuery - ClickHouse adapter', () => {
    it('should handle ClickHouse array syntax', () => {
      const schema = `CREATE TABLE test_ch (id INTEGER PRIMARY KEY, name TEXT)`;
      const query = "SELECT * FROM test_ch WHERE name IN ('a', 'b')";
      const result = executeWithSchema(query, schema, 'clickhouse');
      expect(result.success).toBe(true);
    });
  });

  describe('executeQuery - MongoDB unsupported', () => {
    it('should return warning for MongoDB type', () => {
      const schema = `CREATE TABLE test_mongo (id INTEGER PRIMARY KEY)`;
      const query = 'SELECT * FROM test_mongo';
      const result = executeWithSchema(query, schema, 'mongodb' as unknown as 'sqlite');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('executeQuery - row limit', () => {
    it('should limit results to MAX_ROWS and include truncation message', () => {
      const sql = `
        CREATE TABLE test_limit (id INTEGER PRIMARY KEY);
        ${Array.from({ length: 1001 }, (_, i) => `INSERT INTO test_limit VALUES (${i})`).join(';')};
        SELECT * FROM test_limit;
      `;
      const result = executeQuery(sql);
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1000);
      expect(result.message).toContain('1000');
    });
  });

  describe('executeQuery - execution time', () => {
    it('should include execution time in result', () => {
      const result = executeQuery('SELECT 1 as val');
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('getSchemaInfo', () => {
    it('should return table info for a given schema', () => {
      const schema = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT DEFAULT 'test@test.com'
        );
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          amount REAL
        );
      `;
      const info = getSchemaInfo(schema);
      expect(info.tables).toHaveLength(2);
      const usersTable = info.tables.find(t => t.name === 'users');
      expect(usersTable).toBeDefined();
      expect(usersTable?.columns).toHaveLength(3);
      expect(usersTable?.columns[0].primaryKey).toBe(true);
      expect(usersTable?.columns[1].notNull).toBe(true);
    });

    it('should return empty tables for empty schema', () => {
      const info = getSchemaInfo('');
      expect(info.tables).toHaveLength(0);
    });

    it('should handle PostgreSQL schema types', () => {
      const schema = `
        CREATE TABLE pg_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          active BOOLEAN DEFAULT TRUE
        );
      `;
      const info = getSchemaInfo(schema, 'postgresql');
      expect(info.tables).toHaveLength(1);
      expect(info.tables[0].columns.length).toBeGreaterThan(0);
    });

    it('should handle MySQL schema types', () => {
      const schema = `
        CREATE TABLE mysql_table (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          name TEXT
        );
      `;
      const info = getSchemaInfo(schema, 'mysql');
      expect(info.tables).toHaveLength(1);
    });

    it('should handle ClickHouse schema types', () => {
      const schema = `
        CREATE TABLE ch_table (
          id INTEGER PRIMARY KEY,
          name TEXT
        );
      `;
      const info = getSchemaInfo(schema, 'clickhouse');
      expect(info.tables).toHaveLength(1);
    });
  });

  describe('explainQuery', () => {
    it('should return execution plan for a SELECT query', () => {
      const schema = `
        CREATE TABLE explain_test (id INTEGER PRIMARY KEY, name TEXT);
        CREATE INDEX idx_name ON explain_test(name);
      `;
      const query = 'SELECT * FROM explain_test WHERE name = "test"';
      const result = explainQuery(query, schema);
      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan).toBeDefined();
    });

    it('should handle EXPLAIN for invalid query', () => {
      const schema = `CREATE TABLE explain_err (id INTEGER PRIMARY KEY)`;
      const query = 'SELECT * FROM nonexistent';
      const result = explainQuery(query, schema);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle PostgreSQL schema in explain', () => {
      const schema = `CREATE TABLE pg_explain (id SERIAL PRIMARY KEY, name VARCHAR(100))`;
      const query = 'SELECT * FROM pg_explain WHERE id = 1';
      const result = explainQuery(query, schema, 'postgresql');
      expect(result.success).toBe(true);
    });
  });

  describe('executeWithSchemaMulti', () => {
    it('should execute multiple queries on the same schema', () => {
      const schema = `
        CREATE TABLE multi_test (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO multi_test VALUES (1, 'Alice');
        INSERT INTO multi_test VALUES (2, 'Bob');
      `;
      const inputs = [
        "SELECT * FROM multi_test WHERE id = 1",
        "SELECT * FROM multi_test WHERE id = 2",
      ];
      const results = executeWithSchemaMulti(inputs, schema);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].rows).toHaveLength(1);
      expect(results[0].rows[0].name).toBe('Alice');
      expect(results[1].success).toBe(true);
      expect(results[1].rows[0].name).toBe('Bob');
    });

    it('should persist DML changes across queries in multi execution', () => {
      const schema = `
        CREATE TABLE persist_test (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO persist_test VALUES (1, 'Initial');
      `;
      const inputs = [
        "UPDATE persist_test SET name = 'Updated' WHERE id = 1",
        "SELECT * FROM persist_test WHERE id = 1",
      ];
      const results = executeWithSchemaMulti(inputs, schema);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[1].rows[0].name).toBe('Updated');
    });

    it('should return error results for all inputs when schema is invalid', () => {
      const invalidSchema = 'INVALID SQL STATEMENT';
      const inputs = ['SELECT 1', 'SELECT 2'];
      const results = executeWithSchemaMulti(inputs, invalidSchema);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);
    });

    it('should handle PostgreSQL schema in multi execution', () => {
      const schema = `
        CREATE TABLE pg_multi (id SERIAL PRIMARY KEY, name VARCHAR(100));
        INSERT INTO pg_multi (name) VALUES ('Alice');
        INSERT INTO pg_multi (name) VALUES ('Bob');
      `;
      const inputs = [
        "SELECT * FROM pg_multi WHERE name ILIKE 'alice'",
        "SELECT COUNT(*) as cnt FROM pg_multi",
      ];
      const results = executeWithSchemaMulti(inputs, schema, 'postgresql');
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle MySQL schema in multi execution', () => {
      const schema = `
        CREATE TABLE mysql_multi (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO mysql_multi VALUES (1, 'test');
      `;
      const inputs = ["SELECT * FROM mysql_multi"];
      const results = executeWithSchemaMulti(inputs, schema, 'mysql');
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should handle ClickHouse schema in multi execution', () => {
      const schema = `
        CREATE TABLE ch_multi (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO ch_multi VALUES (1, 'test');
      `;
      const inputs = ["SELECT * FROM ch_multi"];
      const results = executeWithSchemaMulti(inputs, schema, 'clickhouse');
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('splitStatements - edge cases', () => {
    it('should handle empty input', () => {
      expect(splitStatements('')).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      expect(splitStatements('   \n\t  ')).toEqual([]);
    });

    it('should handle comment-only input', () => {
      const result = splitStatements('-- just a comment');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('-- just a comment');
    });

    it('should handle block comment only', () => {
      const result = splitStatements('/* block comment */');
      expect(result).toHaveLength(0);
    });

    it('should handle string with semicolons inside double quotes', () => {
      const result = splitStatements('SELECT "col;name" as val');
      expect(result).toHaveLength(1);
    });

    it('should handle mixed case statements', () => {
      const result = splitStatements('select 1; SELECT 2; SeLeCt 3;');
      expect(result).toEqual(['select 1', 'SELECT 2', 'SeLeCt 3']);
    });
  });

  describe('executeQuery - comment-only and empty statements', () => {
    it('should handle comment-only SQL', () => {
      const result = executeQuery('-- just a comment');
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should handle SQL with only semicolons', () => {
      const result = executeQuery(';;;');
      expect(result.success).toBe(true);
    });
  });

  describe('executeWithSchema - schema caching and LRU behavior', () => {
    it('should cache schema and reuse it', () => {
      const schema = `CREATE TABLE cache_test (id INTEGER PRIMARY KEY, name TEXT)`;
      const query = 'SELECT * FROM cache_test';

      // First call initializes and caches schema
      const result1 = executeWithSchema(query, schema);
      expect(result1.success).toBe(true);

      // Second call should use cached schema
      const result2 = executeWithSchema(query, schema);
      expect(result2.success).toBe(true);
    });

    it('should handle invalid schema gracefully', () => {
      const invalidSchema = 'NOT VALID SQL AT ALL !!!';
      const query = 'SELECT 1';
      const result = executeWithSchema(query, invalidSchema);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
