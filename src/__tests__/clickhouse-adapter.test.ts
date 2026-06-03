import { describe, it, expect } from 'vitest';
import { adaptClickHouseToSQLite } from '@/lib/clickhouse-adapter';

describe('adaptClickHouseToSQLite', () => {
  describe('SETTINGS clause', () => {
    it('strips SETTINGS clause', () => {
      const result = adaptClickHouseToSQLite('SELECT * FROM t SETTINGS max_threads = 4');
      expect(result).not.toContain('SETTINGS');
    });
  });

  describe('WITH FILL', () => {
    it('strips WITH FILL clause', () => {
      const result = adaptClickHouseToSQLite(
        'SELECT toStartOfMonth(date) AS m, count() FROM t GROUP BY m ORDER BY m WITH FILL',
      );
      expect(result).not.toContain('WITH FILL');
    });
  });

  describe('ENGINE clause', () => {
    it('strips ENGINE clause from CREATE TABLE', () => {
      const result = adaptClickHouseToSQLite('CREATE TABLE t (id UInt64) ENGINE = MergeTree()');
      expect(result).not.toContain('ENGINE');
    });
  });

  describe('GLOBAL JOIN', () => {
    it('replaces GLOBAL LEFT JOIN with LEFT JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM a GLOBAL LEFT JOIN b ON a.id = b.id')).toContain('LEFT JOIN');
      expect(adaptClickHouseToSQLite('SELECT * FROM a GLOBAL LEFT JOIN b ON a.id = b.id')).not.toContain('GLOBAL');
    });

    it('replaces GLOBAL INNER JOIN with INNER JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM a GLOBAL INNER JOIN b ON a.id = b.id')).toContain('INNER JOIN');
    });
  });

  describe('ANY JOIN', () => {
    it('replaces ANY LEFT JOIN with LEFT JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM a ANY LEFT JOIN b ON a.id = b.id')).toContain('LEFT JOIN');
      expect(adaptClickHouseToSQLite('SELECT * FROM a ANY LEFT JOIN b ON a.id = b.id')).not.toContain('ANY');
    });

    it('replaces ANY INNER JOIN with INNER JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM a ANY INNER JOIN b ON a.id = b.id')).toContain('INNER JOIN');
    });
  });

  describe('ARRAY JOIN', () => {
    it('replaces ARRAY JOIN with JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM t ARRAY JOIN arr')).toContain('JOIN');
      expect(adaptClickHouseToSQLite('SELECT * FROM t ARRAY JOIN arr')).not.toContain('ARRAY');
    });
  });

  describe('data type replacements', () => {
    it('replaces UInt types with INTEGER', () => {
      expect(adaptClickHouseToSQLite('id UInt64')).toContain('INTEGER');
      expect(adaptClickHouseToSQLite('count UInt32')).toContain('INTEGER');
    });

    it('replaces Int types with INTEGER', () => {
      expect(adaptClickHouseToSQLite('value Int32')).toContain('INTEGER');
    });

    it('replaces Float types with REAL', () => {
      expect(adaptClickHouseToSQLite('price Float64')).toContain('REAL');
    });

    it('replaces String with TEXT', () => {
      expect(adaptClickHouseToSQLite('name String,')).toContain('TEXT');
    });

    it('replaces FixedString with TEXT', () => {
      expect(adaptClickHouseToSQLite('code FixedString(10)')).toContain('TEXT');
    });

    it('strips Nullable wrapper', () => {
      const result = adaptClickHouseToSQLite('name Nullable(String),');
      expect(result).not.toContain('Nullable');
      expect(result).toContain('TEXT');
    });

    it('strips LowCardinality wrapper', () => {
      const result = adaptClickHouseToSQLite('city LowCardinality(String)');
      expect(result).not.toContain('LowCardinality');
    });
  });

  describe('ClickHouse functions', () => {
    it('replaces version() with string literal', () => {
      expect(adaptClickHouseToSQLite('SELECT version()')).not.toContain('version()');
    });

    it('replaces database() with string literal', () => {
      expect(adaptClickHouseToSQLite('SELECT database()')).not.toContain('database()');
    });

    it('replaces toTypeName with string literal', () => {
      expect(adaptClickHouseToSQLite('SELECT toTypeName(id)')).not.toContain('toTypeName');
    });
  });

  describe('MATERIALIZED keyword', () => {
    it('strips MATERIALIZED keyword', () => {
      const result = adaptClickHouseToSQLite('CREATE MATERIALIZED VIEW mv AS SELECT * FROM t');
      expect(result).not.toContain('MATERIALIZED');
      expect(result).toContain('CREATE VIEW');
    });
  });

  describe('PARTITION BY', () => {
    it('strips PARTITION BY clause', () => {
      const result = adaptClickHouseToSQLite('CREATE TABLE t (id UInt64) PARTITION BY toYYYYMM(date)');
      expect(result).not.toContain('PARTITION BY');
    });
  });

  describe('ANTI JOIN', () => {
    it('replaces ANTI JOIN with LEFT JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM a ANTI JOIN b ON a.id = b.id')).toContain('LEFT JOIN');
      expect(adaptClickHouseToSQLite('SELECT * FROM a ANTI JOIN b ON a.id = b.id')).not.toContain('ANTI');
    });
  });

  describe('SEMI JOIN', () => {
    it('replaces SEMI JOIN with JOIN', () => {
      expect(adaptClickHouseToSQLite('SELECT * FROM a SEMI JOIN b ON a.id = b.id')).toContain('JOIN');
      expect(adaptClickHouseToSQLite('SELECT * FROM a SEMI JOIN b ON a.id = b.id')).not.toContain('SEMI');
    });
  });
});
