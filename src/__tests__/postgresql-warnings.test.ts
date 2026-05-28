import { describe, it, expect } from 'vitest';
import { detectDroppedFunctions, adaptWithWarnings, adaptPostgreSQLToSQLite } from '@/lib/postgresql-adapter';

describe('detectDroppedFunctions', () => {
  it('should return empty array when no dropped functions are present', () => {
    const sql = 'SELECT * FROM users WHERE name = \'test\'';
    expect(detectDroppedFunctions(sql)).toEqual([]);
  });

  it('should detect DATE_TRUNC function', () => {
    const sql = 'SELECT DATE_TRUNC(\'month\', created_at) FROM users';
    const dropped = detectDroppedFunctions(sql);
    expect(dropped).toContain('DATE_TRUNC');
  });

  it('should detect multiple dropped functions', () => {
    const sql = 'SELECT GREATEST(a, b), LEAST(c, d), EXTRACT(YEAR FROM date) FROM t';
    const dropped = detectDroppedFunctions(sql);
    expect(dropped).toContain('GREATEST');
    expect(dropped).toContain('LEAST');
    expect(dropped).toContain('EXTRACT');
  });

  it('should not flag functions that have SQLite equivalents', () => {
    const sql = 'SELECT COALESCE(name, \'unknown\'), ABS(price), ROUND(val, 2) FROM t';
    const dropped = detectDroppedFunctions(sql);
    expect(dropped).toEqual([]);
  });
});

describe('adaptWithWarnings', () => {
  it('should return warnings for dropped functions', () => {
    const sql = 'SELECT DATE_TRUNC(\'day\', created_at), GREATEST(a, b) FROM t';
    const result = adaptWithWarnings(sql);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('DATE_TRUNC'))).toBe(true);
    expect(result.warnings.some(w => w.includes('GREATEST'))).toBe(true);
    expect(result.sql).toBeDefined();
  });

  it('should return empty warnings when no functions are dropped', () => {
    const sql = 'SELECT * FROM users WHERE name = \'test\'';
    const result = adaptWithWarnings(sql);
    expect(result.warnings).toEqual([]);
  });
});

describe('normalizeRow column order independence', () => {
  it('should produce same normalized row regardless of column order', () => {
    // Simulating the normalizeRow behavior from verify/route.ts
    function normalizeValue(val: unknown): string {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return Number(val.toPrecision(10)).toString();
      return String(val).trim().toLowerCase();
    }

    function normalizeRow(row: Record<string, unknown>, columns: string[]): string {
      const sortedCols = [...columns].sort((a, b) => a.localeCompare(b));
      return sortedCols.map((col) => normalizeValue(row[col])).join('|');
    }

    const row = { id: 1, name: 'Alice', age: 30 };
    const cols1 = ['id', 'name', 'age'];
    const cols2 = ['age', 'id', 'name'];
    const cols3 = ['name', 'age', 'id'];

    const result1 = normalizeRow(row, cols1);
    const result2 = normalizeRow(row, cols2);
    const result3 = normalizeRow(row, cols3);

    // All should produce the same normalized string since columns are sorted alphabetically
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toBe('30|1|alice'); // age|id|name (alphabetical)
  });
});
