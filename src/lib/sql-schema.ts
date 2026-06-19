import { z } from 'zod';

export const sqlString = z
  .string()
  .min(1, { message: 'SQL query cannot be empty' })
  .max(10000, { message: 'Query is too long' });

export const VALID_DB_TYPES = ['sqlite', 'postgresql', 'clickhouse', 'mongodb'] as const;

export const sqlExecuteSchema = z.object({
  sql: sqlString,
  dbType: z.enum(VALID_DB_TYPES).optional(),
  taskId: z.string().optional(),
});

export const sqlExplainSchema = z.object({
  sql: sqlString,
  dbType: z.enum(['sqlite', 'postgresql', 'mongodb']).optional(),
  taskId: z.string().min(1, { message: 'taskId is required for EXPLAIN' }),
});

export const sqlVerifySchema = z.object({
  sql: sqlString,
  taskId: z.string().min(1, { message: 'taskId is required' }),
  dbType: z.enum(VALID_DB_TYPES).optional(),
});
