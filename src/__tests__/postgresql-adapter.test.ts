import { describe, it, expect } from 'vitest';
import { adaptPostgreSQLToSQLite } from '@/lib/postgresql-adapter';

describe('adaptPostgreSQLToSQLite', () => {
  describe('boolean handling', () => {
    it('replaces TRUE with 1', () => {
      expect(adaptPostgreSQLToSQLite('SELECT * FROM t WHERE active = TRUE')).toContain('= 1');
    });

    it('replaces FALSE with 0', () => {
      expect(adaptPostgreSQLToSQLite('SELECT * FROM t WHERE active = FALSE')).toContain('= 0');
    });

    it('replaces DEFAULT TRUE with DEFAULT 1', () => {
      expect(adaptPostgreSQLToSQLite('active BOOLEAN DEFAULT TRUE')).toContain('DEFAULT 1');
    });
  });

  describe('ILIKE handling', () => {
    it('replaces ILIKE with LIKE', () => {
      expect(adaptPostgreSQLToSQLite("SELECT * FROM t WHERE name ILIKE 'john%'")).toContain('LIKE');
      expect(adaptPostgreSQLToSQLite("SELECT * FROM t WHERE name ILIKE 'john%'")).not.toContain('ILIKE');
    });
  });

  describe('type casting (::)', () => {
    it('replaces ::integer with AS INTEGER', () => {
      const result = adaptPostgreSQLToSQLite("SELECT '123'::integer");
      expect(result).toContain('AS INTEGER');
      expect(result).not.toContain('::');
    });

    it('replaces ::text with AS TEXT', () => {
      const result = adaptPostgreSQLToSQLite('SELECT name::text FROM t');
      expect(result).toContain('AS TEXT');
    });
  });

  describe('function replacements', () => {
    it('replaces SUBSTRING with SUBSTR', () => {
      expect(adaptPostgreSQLToSQLite('SELECT SUBSTRING(name, 1, 3)')).toContain('SUBSTR');
    });

    it('replaces CEILING with CEIL', () => {
      expect(adaptPostgreSQLToSQLite('SELECT CEILING(price)')).toContain('CEIL');
    });

    it('replaces NOW() with datetime function', () => {
      expect(adaptPostgreSQLToSQLite('SELECT NOW()')).toContain("datetime('now')");
    });

    it('replaces CURRENT_TIMESTAMP', () => {
      expect(adaptPostgreSQLToSQLite('SELECT CURRENT_TIMESTAMP')).toContain("datetime('now')");
    });
  });

  describe('IS TRUE/FALSE', () => {
    it('replaces TRUE with 1 in IS TRUE context', () => {
      // Note: TRUE is replaced with 1 before IS TRUE pattern, so result is "IS 1"
      expect(adaptPostgreSQLToSQLite('SELECT * FROM t WHERE active IS TRUE')).toContain('IS 1');
    });

    it('replaces FALSE with 0 in IS FALSE context', () => {
      expect(adaptPostgreSQLToSQLite('SELECT * FROM t WHERE active IS FALSE')).toContain('IS 0');
    });

    it('replaces IS NOT TRUE with IS NOT 1', () => {
      expect(adaptPostgreSQLToSQLite('SELECT * FROM t WHERE active IS NOT TRUE')).toContain('IS NOT 1');
    });
  });

  describe('LIMIT ALL', () => {
    it('replaces LIMIT ALL with LIMIT -1', () => {
      expect(adaptPostgreSQLToSQLite('SELECT * FROM t LIMIT ALL')).toContain('LIMIT -1');
    });
  });

  describe('data type replacements', () => {
    it('replaces VARCHAR(n) with TEXT', () => {
      expect(adaptPostgreSQLToSQLite('name VARCHAR(100)')).toContain('TEXT');
    });

    it('replaces BOOLEAN with INTEGER', () => {
      expect(adaptPostgreSQLToSQLite('active BOOLEAN')).toContain('INTEGER');
    });

    it('replaces SERIAL PRIMARY KEY', () => {
      expect(adaptPostgreSQLToSQLite('id SERIAL PRIMARY KEY')).toContain('INTEGER PRIMARY KEY AUTOINCREMENT');
    });

    it('replaces JSONB with TEXT', () => {
      expect(adaptPostgreSQLToSQLite('data JSONB')).toContain('TEXT');
    });

    it('replaces UUID with TEXT', () => {
      expect(adaptPostgreSQLToSQLite('user_id UUID')).toContain('TEXT');
    });
  });

  describe('string aggregation', () => {
    it('replaces STRING_AGG with GROUP_CONCAT', () => {
      const result = adaptPostgreSQLToSQLite("SELECT STRING_AGG(name, ',') FROM t");
      expect(result).toContain('GROUP_CONCAT');
      expect(result).not.toContain('STRING_AGG');
    });

    it('replaces ARRAY_AGG with GROUP_CONCAT', () => {
      const result = adaptPostgreSQLToSQLite('SELECT ARRAY_AGG(name) FROM t');
      expect(result).toContain('GROUP_CONCAT');
      expect(result).not.toContain('ARRAY_AGG');
    });
  });

  describe('SIMILAR TO', () => {
    it('replaces SIMILAR TO with LIKE', () => {
      expect(adaptPostgreSQLToSQLite("SELECT * FROM t WHERE name SIMILAR TO 'j%'")).toContain('LIKE');
    });
  });

  describe('FOR UPDATE', () => {
    it('removes FOR UPDATE clause', () => {
      const result = adaptPostgreSQLToSQLite('SELECT * FROM t FOR UPDATE');
      expect(result).not.toContain('FOR UPDATE');
    });
  });

  describe('DISTINCT ON', () => {
    it('replaces DISTINCT ON with DISTINCT', () => {
      const result = adaptPostgreSQLToSQLite('SELECT DISTINCT ON (id) * FROM t');
      expect(result).toContain('DISTINCT');
      expect(result).not.toContain('DISTINCT ON');
    });
  });
});
