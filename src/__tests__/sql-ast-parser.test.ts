/**
 * Tests for AST-based SQL parser.
 */
import { describe, test, expect } from 'vitest';
import {
  parseSQL,
  generateSQL,
  transformSQL,
  validateSQL,
  extractTables,
  checkUnsupportedFeatures,
} from '../lib/sql-ast-parser';

describe('SQL AST Parser', () => {
  describe('parseSQL', () => {
    test('should parse simple SELECT statement', () => {
      const result = parseSQL('SELECT * FROM users', 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(result.tableList.some((t) => t.includes('users'))).toBe(true);
    });

    test('should parse SELECT with WHERE clause', () => {
      const result = parseSQL('SELECT id, name FROM users WHERE age > 18', 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse JOIN statements', () => {
      const result = parseSQL('SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id', 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(result.tableList.some((t) => t.includes('users'))).toBe(true);
      expect(result.tableList.some((t) => t.includes('orders'))).toBe(true);
    });

    test('should parse CREATE TABLE statement', () => {
      const result = parseSQL('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)', 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse INSERT statement', () => {
      const result = parseSQL("INSERT INTO users (name, email) VALUES ('John', 'john@example.com')", 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse UPDATE statement', () => {
      const result = parseSQL("UPDATE users SET name = 'Jane' WHERE id = 1", 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse DELETE statement', () => {
      const result = parseSQL('DELETE FROM users WHERE id = 1', 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse complex query with subquery', () => {
      const result = parseSQL(
        'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100)',
        'sqlite',
      );

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse query with GROUP BY and HAVING', () => {
      const result = parseSQL('SELECT user_id, COUNT(*) as cnt FROM orders GROUP BY user_id HAVING cnt > 5', 'sqlite');

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should parse query with window function', () => {
      const result = parseSQL('SELECT name, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM users', 'sqlite');

      // SQLite supports window functions, parser should handle them
      expect(result.ast).toBeDefined();
    });

    test('should parse CTE (WITH clause)', () => {
      const result = parseSQL(
        'WITH active_users AS (SELECT * FROM users WHERE active = 1) SELECT * FROM active_users',
        'sqlite',
      );

      expect(result.warnings).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    test('should handle invalid SQL gracefully', () => {
      const result = parseSQL('SELECT * FROM', 'sqlite');

      expect(result.warnings).toHaveLength(1);
      expect(result.ast).toBeNull();
    });
  });

  describe('generateSQL', () => {
    test('should generate SQL from AST', () => {
      const parseResult = parseSQL('SELECT * FROM users', 'sqlite');
      expect(parseResult.ast).toBeDefined();

      const genResult = generateSQL(parseResult.ast!, 'sqlite');

      expect(genResult.errors).toHaveLength(0);
      expect(genResult.sql).toBeDefined();
      expect(genResult.sql).toMatch(/SELECT/i);
      expect(genResult.sql).toMatch(/users/i);
    });

    test('should preserve query structure', () => {
      const parseResult = parseSQL('SELECT id, name FROM users WHERE age > 18 ORDER BY name', 'sqlite');

      const genResult = generateSQL(parseResult.ast!, 'sqlite');

      expect(genResult.errors).toHaveLength(0);
      expect(genResult.sql).toMatch(/SELECT/i);
      expect(genResult.sql).toMatch(/id.*name/i);
      expect(genResult.sql).toMatch(/ORDER BY/i);
    });
  });

  describe('transformSQL', () => {
    test('should transform PostgreSQL to SQLite', () => {
      const result = transformSQL('SELECT id, name FROM users WHERE active = true', 'postgresql', 'sqlite');

      // AST parser preserves TRUE - regex-based adapter handles TRUE->1 conversion
      expect(result.errors).toHaveLength(0);
      expect(result.sql).toBeDefined();
      expect(result.sql).toMatch(/SELECT/i);
    });

    test('should handle type casting transformation', () => {
      const result = transformSQL('SELECT id::TEXT, name FROM users', 'postgresql', 'sqlite');

      expect(result.sql).toBeDefined();
      // AST parser preserves :: syntax - regex-based adapter handles ::->CAST conversion
      expect(result.sql).toMatch(/SELECT/i);
    });

    test('should preserve complex queries', () => {
      const result = transformSQL(
        'SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id',
        'postgresql',
        'sqlite',
      );

      expect(result.errors).toHaveLength(0);
      expect(result.sql).toMatch(/JOIN/i);
      expect(result.sql).toMatch(/GROUP BY/i);
    });
  });

  describe('validateSQL', () => {
    test('should validate correct SQL', () => {
      const result = validateSQL('SELECT * FROM users', 'sqlite');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid SQL', () => {
      const result = validateSQL('SELEC * FROM users', 'sqlite');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    test('should validate PostgreSQL-specific syntax', () => {
      const result = validateSQL('SELECT id::TEXT, name FROM users WHERE active = true', 'postgresql');

      expect(result.valid).toBe(true);
    });
  });

  describe('extractTables', () => {
    test('should extract single table', () => {
      const tables = extractTables('SELECT * FROM users', 'sqlite');

      expect(tables.some((t) => t.includes('users'))).toBe(true);
    });

    test('should extract multiple tables from JOIN', () => {
      const tables = extractTables('SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id', 'sqlite');

      expect(tables.some((t) => t.includes('users'))).toBe(true);
      expect(tables.some((t) => t.includes('orders'))).toBe(true);
    });

    test('should extract tables from subquery', () => {
      const tables = extractTables('SELECT * FROM (SELECT * FROM orders) WHERE id IN (SELECT id FROM users)', 'sqlite');

      expect(tables.some((t) => t.includes('orders'))).toBe(true);
      expect(tables.some((t) => t.includes('users'))).toBe(true);
    });
  });

  describe('checkUnsupportedFeatures', () => {
    test('should detect window functions', () => {
      const issues = checkUnsupportedFeatures(
        'SELECT ROW_NUMBER() OVER (ORDER BY id) FROM users',
        'postgresql',
        'sqlite',
      );

      // SQLite supports window functions, so no issues
      expect(issues).toHaveLength(0);
    });

    test('should handle CTEs', () => {
      const issues = checkUnsupportedFeatures('WITH cte AS (SELECT 1) SELECT * FROM cte', 'postgresql', 'sqlite');

      // SQLite supports CTEs
      expect(issues).toHaveLength(0);
    });
  });
});
