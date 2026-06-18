import { describe, it, expect } from 'vitest';
import { sqlString, sqlExecuteSchema, sqlExplainSchema, sqlVerifySchema } from '@/lib/sql-schema';

describe('sqlString', () => {
  it('accepts valid SQL string', () => {
    expect(sqlString.safeParse('SELECT * FROM users').success).toBe(true);
  });

  it('rejects empty string', () => {
    const result = sqlString.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects string exceeding max length', () => {
    const result = sqlString.safeParse('a'.repeat(10001));
    expect(result.success).toBe(false);
  });
});

describe('sqlExecuteSchema', () => {
  it('accepts SQL only', () => {
    const result = sqlExecuteSchema.safeParse({ sql: 'SELECT 1' });
    expect(result.success).toBe(true);
  });

  it('accepts SQL with valid dbType', () => {
    expect(sqlExecuteSchema.safeParse({ sql: 'SELECT 1', dbType: 'postgresql' }).success).toBe(true);
    expect(sqlExecuteSchema.safeParse({ sql: 'SELECT 1', dbType: 'clickhouse' }).success).toBe(true);
    expect(sqlExecuteSchema.safeParse({ sql: 'SELECT 1', dbType: 'mongodb' }).success).toBe(true);
    expect(sqlExecuteSchema.safeParse({ sql: 'SELECT 1', dbType: 'sqlite' }).success).toBe(true);
  });

  it('rejects invalid dbType', () => {
    const result = sqlExecuteSchema.safeParse({ sql: 'SELECT 1', dbType: 'mysql' });
    expect(result.success).toBe(false);
  });

  it('accepts optional taskId', () => {
    expect(sqlExecuteSchema.safeParse({ sql: 'SELECT 1', taskId: 'task-1' }).success).toBe(true);
  });

  it('rejects missing sql', () => {
    const result = sqlExecuteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('sqlExplainSchema', () => {
  it('accepts valid explain input', () => {
    const result = sqlExplainSchema.safeParse({ sql: 'SELECT 1', taskId: 'task-1' });
    expect(result.success).toBe(true);
  });

  it('accepts valid dbType for explain', () => {
    expect(sqlExplainSchema.safeParse({ sql: 'SELECT 1', taskId: 't', dbType: 'sqlite' }).success).toBe(true);
    expect(sqlExplainSchema.safeParse({ sql: 'SELECT 1', taskId: 't', dbType: 'postgresql' }).success).toBe(true);
    expect(sqlExplainSchema.safeParse({ sql: 'SELECT 1', taskId: 't', dbType: 'mongodb' }).success).toBe(true);
  });

  it('rejects invalid dbType for explain', () => {
    const result = sqlExplainSchema.safeParse({ sql: 'SELECT 1', taskId: 't', dbType: 'clickhouse' });
    expect(result.success).toBe(false);
  });

  it('rejects explain without taskId', () => {
    const result = sqlExplainSchema.safeParse({ sql: 'SELECT 1' });
    expect(result.success).toBe(false);
  });
});

describe('sqlVerifySchema', () => {
  it('accepts valid verify input', () => {
    const result = sqlVerifySchema.safeParse({ sql: 'SELECT 1', taskId: 'task-1' });
    expect(result.success).toBe(true);
  });

  it('rejects verify without taskId', () => {
    const result = sqlVerifySchema.safeParse({ sql: 'SELECT 1' });
    expect(result.success).toBe(false);
  });

  it('accepts optional dbType', () => {
    expect(sqlVerifySchema.safeParse({ sql: 'SELECT 1', taskId: 't', dbType: 'postgresql' }).success).toBe(true);
  });
});
