/**
 * Auto-configuration module.
 * Automatically detects available databases, finds free ports,
 * and determines the optimal configuration for the application.
 */

import net from 'net';

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mongodb' | 'clickhouse';
  available: boolean;
  connectionString?: string;
  mode: 'real' | 'adapter' | 'in-memory';
}

export interface AppConfig {
  port: number;
  databases: DatabaseConfig[];
  primaryDatabase: DatabaseConfig;
}

/**
 * Find a free port starting from the given port number.
 * Uses net.createServer() to probe port availability.
 */
export async function findFreePort(startFrom: number = 3000): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startFrom, '127.0.0.1', () => {
      server.close();
      resolve(startFrom);
    });
    server.on('error', () => {
      // Port is in use, try next one
      resolve(findFreePort(startFrom + 1));
    });
  });
}

/**
 * Test if a PostgreSQL connection is available.
 * Returns connection info if available, undefined otherwise.
 */
async function testPostgreSQL(): Promise<{ available: boolean; connectionString?: string }> {
  const envUrl = process.env.DATABASE_URL_POSTGRESQL || process.env.PG_CONNECTION_STRING;
  if (!envUrl) {
    return { available: false };
  }

  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: envUrl, connectionTimeoutMillis: 3000 });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { available: true, connectionString: envUrl };
  } catch {
    return { available: false };
  }
}

/**
 * Test if a MongoDB connection is available.
 * Returns connection info if available, undefined otherwise.
 */
async function testMongoDB(): Promise<{ available: boolean; connectionString?: string }> {
  const envUrl = process.env.DATABASE_URL_MONGODB || process.env.MONGODB_URI;
  if (!envUrl) {
    return { available: false };
  }

  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(envUrl, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    await client.db().command({ ping: 1 });
    await client.close();
    return { available: true, connectionString: envUrl };
  } catch {
    return { available: false };
  }
}

/**
 * Detect all available databases and return configuration.
 */
export async function detectAvailableDatabases(): Promise<DatabaseConfig[]> {
  const [pg, mongo] = await Promise.all([
    testPostgreSQL(),
    testMongoDB(),
  ]);

  const configs: DatabaseConfig[] = [
    {
      type: 'sqlite',
      available: true,
      mode: 'in-memory',
    },
    {
      type: 'postgresql',
      available: pg.available,
      connectionString: pg.connectionString,
      mode: pg.available ? 'real' : 'adapter',
    },
    {
      type: 'mongodb',
      available: mongo.available,
      connectionString: mongo.connectionString,
      mode: mongo.available ? 'real' : 'in-memory',
    },
    {
      type: 'clickhouse',
      available: false,
      mode: 'adapter',
    },
  ];

  return configs;
}

/**
 * Get the optimal database configuration.
 * Priority: real connection > adapter > in-memory
 */
export function getOptimalDatabase(configs: DatabaseConfig[]): DatabaseConfig {
  // Prefer real connections first
  const real = configs.find(c => c.available && c.mode === 'real');
  if (real) return real;

  // Then adapters
  const adapter = configs.find(c => c.available && c.mode === 'adapter');
  if (adapter) return adapter;

  // Fallback to SQLite in-memory
  return configs.find(c => c.type === 'sqlite')!;
}

/**
 * Get the complete application configuration.
 */
export async function getAppConfig(startPort: number = 3000): Promise<AppConfig> {
  const [port, databases] = await Promise.all([
    findFreePort(startPort),
    detectAvailableDatabases(),
  ]);

  const primaryDatabase = getOptimalDatabase(databases);

  return {
    port,
    databases,
    primaryDatabase,
  };
}
