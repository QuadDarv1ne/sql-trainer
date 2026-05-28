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
    });

    it('should handle multiple statements with backslash-escaped quotes', () => {
      const sql = "SELECT 'a\\'; b'; SELECT 2;";
      const result = splitStatements(sql);
      expect(result).toHaveLength(2);
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
});
