/**
 * PostgreSQL Query Engine.
 * Supports real PostgreSQL connections with fallback to SQLite adapter.
 */

import { adaptPostgreSQLToSQLite } from './postgresql-adapter';
import { executeWithSchema as executeSQLite, executeQuery } from './sql-engine';

export interface PgResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime?: number;
}

/**
 * Execute SQL on a real PostgreSQL connection.
 * Falls back to SQLite adapter if no connection string provided.
 */
export async function executePgWithFallback(
  sql: string,
  schemaSql: string,
  connectionString?: string
): Promise<PgResult> {
  // If no real PostgreSQL connection available, fall back to adapter
  if (!connectionString) {
    const adaptedSql = adaptPostgreSQLToSQLite(sql);
    return executeSQLite(adaptedSql, schemaSql, 'sqlite') as PgResult;
  }

  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 5000,
    });

    await client.connect();

    // Apply schema if provided
    if (schemaSql) {
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch {
          // Ignore schema errors (tables may already exist)
        }
      }
    }

    const startTime = Date.now();
    try {
      const result = await client.query(sql);
      const executionTime = Date.now() - startTime;

      const columns = result.fields.map((f: { name: string }) => f.name);
      const rows = result.rows;

      return {
        success: true,
        columns,
        rows,
        executionTime,
      };
    } finally {
      await client.end();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown PostgreSQL error';
    return {
      success: false,
      columns: [],
      rows: [],
      error: `PostgreSQL error: ${message}`,
    };
  }
}

/**
 * Execute SQL without schema (for arbitrary queries).
 */
export async function executePgQuery(
  sql: string,
  connectionString?: string
): Promise<PgResult> {
  if (!connectionString) {
    const adaptedSql = adaptPostgreSQLToSQLite(sql);
    return executeQuery(adaptedSql, 'sqlite') as PgResult;
  }

  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 5000,
    });

    await client.connect();
    const startTime = Date.now();
    try {
      const result = await client.query(sql);
      const executionTime = Date.now() - startTime;

      const columns = result.fields.map((f: { name: string }) => f.name);
      const rows = result.rows;

      return {
        success: true,
        columns,
        rows,
        executionTime,
      };
    } finally {
      await client.end();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown PostgreSQL error';
    return {
      success: false,
      columns: [],
      rows: [],
      error: `PostgreSQL error: ${message}`,
    };
  }
}

/**
 * EXPLAIN query for PostgreSQL.
 */
export async function explainPgQuery(
  sql: string,
  schemaSql: string,
  connectionString?: string
): Promise<PgResult & { plan?: string }> {
  if (!connectionString) {
    // Fallback: use SQLite EXPLAIN
    const adaptedSql = adaptPostgreSQLToSQLite(sql);
    const explainSql = `EXPLAIN QUERY PLAN ${adaptedSql}`;
    const result = executeSQLite(explainSql, schemaSql, 'sqlite') as PgResult;

    if (result.success && result.rows.length > 0) {
      const plan = result.rows.map(r => Object.values(r).join(' ')).join('\n');
      return { ...result, plan };
    }
    return result;
  }

  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    await client.connect();

    if (schemaSql) {
      const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        try { await client.query(stmt); } catch { /* ignore */ }
      }
    }

    const explainResult = await client.query(`EXPLAIN (FORMAT TEXT) ${sql}`);
    const plan = explainResult.rows.map(r => Object.values(r).join('')).join('\n');

    await client.end();

    return {
      success: true,
      columns: ['QUERY PLAN'],
      rows: explainResult.rows,
      plan,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown PostgreSQL error';
    return {
      success: false,
      columns: [],
      rows: [],
      error: `PostgreSQL EXPLAIN error: ${message}`,
    };
  }
}
