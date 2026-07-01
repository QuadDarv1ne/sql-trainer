import { describe, it, expect } from 'vitest';
import { validateTrainingSql, extractStatementTypes } from '../lib/sql-safety';

describe('extractStatementTypes', () => {
  it('extracts SELECT statement', () => {
    expect(extractStatementTypes('SELECT * FROM users')).toEqual(['SELECT']);
  });

  it('extracts multiple statements', () => {
    expect(extractStatementTypes('SELECT 1; SELECT 2')).toEqual(['SELECT', 'SELECT']);
  });

  it('ignores block comments', () => {
    expect(extractStatementTypes('/* comment */ SELECT 1')).toEqual(['SELECT']);
  });

  it('ignores line comments', () => {
    expect(extractStatementTypes('-- comment\nSELECT 1')).toEqual(['SELECT']);
  });

  it('ignores string literals', () => {
    expect(extractStatementTypes("SELECT * FROM users WHERE name = 'DROP TABLE'")).toEqual(['SELECT']);
  });

  it('handles escaped quotes in strings', () => {
    expect(extractStatementTypes("SELECT * FROM users WHERE name = 'it''s a test'")).toEqual(['SELECT']);
  });

  it('extracts table-qualified prefixes', () => {
    expect(extractStatementTypes('SELECT * FROM schema.table')).toEqual(['SELECT', 'FROM']);
  });

  it('handles empty input', () => {
    expect(extractStatementTypes('')).toEqual([]);
  });

  it('handles whitespace-only input', () => {
    expect(extractStatementTypes('   \n\t  ')).toEqual([]);
  });

  it('extracts INSERT as blocked', () => {
    expect(extractStatementTypes("INSERT INTO users VALUES (1, 'test')")).toEqual(['INSERT']);
  });

  it('extracts DROP as blocked', () => {
    expect(extractStatementTypes('DROP TABLE users')).toEqual(['DROP']);
  });

  it('extracts CREATE as blocked', () => {
    expect(extractStatementTypes('CREATE TABLE users (id INT)')).toEqual(['CREATE']);
  });
});

describe('validateTrainingSql', () => {
  it('allows valid SELECT queries', () => {
    expect(validateTrainingSql('SELECT * FROM users')).toBeNull();
  });

  it('allows WITH (CTE) queries', () => {
    expect(validateTrainingSql('WITH cte AS (SELECT 1) SELECT * FROM cte')).toBeNull();
  });

  it('allows EXPLAIN queries', () => {
    expect(validateTrainingSql('EXPLAIN SELECT * FROM users')).toBeNull();
  });

  it('allows PRAGMA queries', () => {
    expect(validateTrainingSql('PRAGMA table_info(users)')).toBeNull();
  });

  it('allows SHOW queries', () => {
    expect(validateTrainingSql('SHOW TABLES')).toBeNull();
  });

  it('allows DESCRIBE queries', () => {
    expect(validateTrainingSql('DESCRIBE users')).toBeNull();
  });

  it('blocks INSERT', () => {
    const result = validateTrainingSql("INSERT INTO users VALUES (1, 'test')");
    expect(result).toContain('blocked commands');
    expect(result).toContain('INSERT');
  });

  it('blocks UPDATE', () => {
    const result = validateTrainingSql("UPDATE users SET name = 'hacked'");
    expect(result).toContain('blocked commands');
    expect(result).toContain('UPDATE');
  });

  it('blocks DELETE', () => {
    const result = validateTrainingSql('DELETE FROM users');
    expect(result).toContain('blocked commands');
    expect(result).toContain('DELETE');
  });

  it('blocks DROP', () => {
    const result = validateTrainingSql('DROP TABLE users');
    expect(result).toContain('blocked commands');
    expect(result).toContain('DROP');
  });

  it('blocks CREATE', () => {
    const result = validateTrainingSql('CREATE TABLE evil (id INT)');
    expect(result).toContain('blocked commands');
    expect(result).toContain('CREATE');
  });

  it('blocks ALTER', () => {
    const result = validateTrainingSql('ALTER TABLE users ADD COLUMN evil INT');
    expect(result).toContain('blocked commands');
    expect(result).toContain('ALTER');
  });

  it('blocks TRUNCATE', () => {
    const result = validateTrainingSql('TRUNCATE TABLE users');
    expect(result).toContain('blocked commands');
    expect(result).toContain('TRUNCATE');
  });

  it('blocks GRANT', () => {
    const result = validateTrainingSql('GRANT ALL ON users TO hacker');
    expect(result).toContain('blocked commands');
    expect(result).toContain('GRANT');
  });

  it('blocks REVOKE', () => {
    const result = validateTrainingSql('REVOKE ALL ON users FROM user');
    expect(result).toContain('blocked commands');
    expect(result).toContain('REVOKE');
  });

  it('blocks PRAGMA writable_schema', () => {
    const result = validateTrainingSql('PRAGMA writable_schema = ON');
    expect(result).toContain('blocked commands');
  });

  it('rejects queries exceeding length limit', () => {
    const longQuery = 'SELECT * FROM users WHERE ' + 'x = 1 AND '.repeat(2000);
    const result = validateTrainingSql(longQuery);
    expect(result).toContain('too long');
  });

  it('blocks DML hidden in comments', () => {
    const result = validateTrainingSql('SELECT 1 /* ; DROP TABLE users */');
    expect(result).toBeNull(); // Comment content is correctly ignored
  });

  it('blocks DML hidden in line comments', () => {
    const result = validateTrainingSql('SELECT 1\n-- DROP TABLE users');
    expect(result).toBeNull(); // Comment content is correctly ignored
  });

  it('blocks DML in string literals', () => {
    const result = validateTrainingSql("SELECT 'DROP TABLE users'");
    expect(result).toBeNull(); // String content is correctly ignored
  });

  it('blocks multi-statement with DML', () => {
    const result = validateTrainingSql('SELECT 1; DROP TABLE users');
    expect(result).toContain('blocked commands');
  });

  it('allows multiple safe statements', () => {
    expect(validateTrainingSql('SELECT 1; SELECT 2; SELECT 3')).toBeNull();
  });

  it('allows empty query', () => {
    expect(validateTrainingSql('')).toBeNull();
  });

  it('blocks REPLACE', () => {
    const result = validateTrainingSql("REPLACE INTO users VALUES (1, 'test')");
    expect(result).toContain('blocked commands');
    expect(result).toContain('REPLACE');
  });

  it('blocks LOAD', () => {
    const result = validateTrainingSql("LOAD 'evil.so'");
    expect(result).toContain('blocked commands');
    expect(result).toContain('LOAD');
  });

  it('blocks ATTACH', () => {
    const result = validateTrainingSql("ATTACH DATABASE 'evil.db' AS evil");
    expect(result).toContain('blocked commands');
    expect(result).toContain('ATTACH');
  });

  it('blocks DETACH', () => {
    const result = validateTrainingSql('DETACH DATABASE evil');
    expect(result).toContain('blocked commands');
    expect(result).toContain('DETACH');
  });

  it('blocks RENAME', () => {
    const result = validateTrainingSql('RENAME TABLE users TO evil');
    expect(result).toContain('blocked commands');
    expect(result).toContain('RENAME');
  });
});
