import { describe, it, expect } from 'vitest';
import { splitSqlSegments } from '@/lib/sql-utils';

describe('sql-utils', () => {
  describe('splitSqlSegments', () => {
    it('should return single segment for plain SQL without strings', () => {
      const result = splitSqlSegments('SELECT * FROM users');
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('should separate single-quoted string literals', () => {
      const result = splitSqlSegments("SELECT * FROM users WHERE name = 'Alice'");
      // Segment 0: non-string before first quote
      // Segment 1: from opening quote to closing quote + trailing non-string
      expect(result[0]).toBe('SELECT * FROM users WHERE name = ');
      expect(result[1]).toBe("'Alice'");
    });

    it('should handle double-quoted identifiers followed by more SQL', () => {
      const result = splitSqlSegments('SELECT "name" FROM users');
      expect(result[0]).toBe('SELECT ');
      // The function includes everything from opening quote onwards in segment 1
      expect(result[1]).toContain('"name"');
    });

    it('should handle multiple single-quoted strings', () => {
      const result = splitSqlSegments("SELECT * FROM t WHERE a = 'Alice' AND b = 'Bob'");
      // segment 0: non-string before first quote
      // segment 1: from 'Alice' to end of string + trailing non-string
      // segment 2: 'Bob' and trailing
      expect(result[0]).toBe('SELECT * FROM t WHERE a = ');
      expect(result[1]).toContain("'Alice'");
      expect(result[2]).toContain("'Bob'");
    });

    it('should handle escaped single quotes (doubled)', () => {
      const result = splitSqlSegments("SELECT 'it''s a test' as val");
      expect(result[1]).toContain("'it''s");
    });

    it('should handle escaped double quotes (doubled)', () => {
      const result = splitSqlSegments('SELECT "col""name" as val');
      expect(result[1]).toContain('"col""name"');
    });

    it('should handle empty input', () => {
      const result = splitSqlSegments('');
      expect(result).toEqual([]);
    });

    it('should handle SQL with only whitespace', () => {
      const result = splitSqlSegments('   ');
      expect(result).toEqual(['   ']);
    });

    it('should handle string at the very beginning', () => {
      const result = splitSqlSegments("'literal' = col");
      expect(result[0]).toBe('');
      expect(result[1]).toContain("'literal'");
    });

    it('should handle empty string literal', () => {
      const result = splitSqlSegments("SELECT '' as empty");
      expect(result[1]).toContain("''");
    });

    it('should handle string with semicolons inside', () => {
      const result = splitSqlSegments("SELECT 'hello; world; test' as val");
      expect(result[1]).toContain("'hello; world; test'");
    });

    it('should preserve string content for LIKE patterns', () => {
      const result = splitSqlSegments("SELECT * FROM t WHERE name LIKE '%test%'");
      expect(result[1]).toContain("'%test%'");
    });

    it('should handle string containing backslash', () => {
      const result = splitSqlSegments("SELECT 'path\\\\to' as val");
      expect(result[1]).toContain("'path");
    });

    it('should alternate non-string and string segments correctly', () => {
      const result = splitSqlSegments("SELECT 'a', 'b', 'c'");
      // Even indices are non-string, odd are string+trailing
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result[0]).toBe('SELECT ');
    });
  });
});
