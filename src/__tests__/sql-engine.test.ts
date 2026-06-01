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

import { executeQuery, executeWithSchema, splitStatements } from '@/lib/sql-engine';

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
      expect(result.warnings!.some(w => w.includes('DATE_TRUNC'))).toBe(true);
    });
  });
});
