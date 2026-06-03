import { describe, it, expect } from 'vitest';
import { getOptimalDatabase } from '@/lib/auto-config';
import type { DatabaseConfig } from '@/lib/auto-config';

function makeDb(
  overrides: Partial<DatabaseConfig> & { type: DatabaseConfig['type'] }
): DatabaseConfig {
  const { type, ...rest } = overrides;
  return {
    type,
    available: true,
    mode: 'adapter',
    ...rest,
  };
}

describe('getOptimalDatabase', () => {
  it('should prefer real connections over adapters', () => {
    const configs: DatabaseConfig[] = [
      makeDb({ type: 'sqlite', available: true, mode: 'in-memory' }),
      makeDb({ type: 'postgresql', available: true, mode: 'real', connectionString: 'pg://localhost' }),
    ];

    const result = getOptimalDatabase(configs);
    expect(result.type).toBe('postgresql');
    expect(result.mode).toBe('real');
  });

  it('should fall back to adapter when no real connection', () => {
    const configs: DatabaseConfig[] = [
      makeDb({ type: 'sqlite', available: true, mode: 'in-memory' }),
      makeDb({ type: 'postgresql', available: true, mode: 'adapter' }),
    ];

    const result = getOptimalDatabase(configs);
    expect(result.mode).toBe('adapter');
  });

  it('should fall back to SQLite when nothing else is available', () => {
    const configs: DatabaseConfig[] = [
      makeDb({ type: 'sqlite', available: true, mode: 'in-memory' }),
      makeDb({ type: 'postgresql', available: false, mode: 'adapter' }),
      makeDb({ type: 'clickhouse', available: false, mode: 'adapter' }),
    ];

    const result = getOptimalDatabase(configs);
    expect(result.type).toBe('sqlite');
  });

  it('should choose PostgreSQL real over any adapter', () => {
    const configs: DatabaseConfig[] = [
      makeDb({ type: 'sqlite', available: true, mode: 'in-memory' }),
      makeDb({ type: 'postgresql', available: true, mode: 'real' }),
      makeDb({ type: 'mongodb', available: true, mode: 'in-memory' }),
      makeDb({ type: 'clickhouse', available: true, mode: 'adapter' }),
    ];

    const result = getOptimalDatabase(configs);
    expect(result.type).toBe('postgresql');
    expect(result.mode).toBe('real');
  });

  it('should throw if SQLite config is missing', () => {
    const configs: DatabaseConfig[] = [
      makeDb({ type: 'postgresql', available: false, mode: 'adapter' }),
    ];

    expect(() => getOptimalDatabase(configs)).toThrow('SQLite configuration not found');
  });

  it('should handle empty configs array', () => {
    expect(() => getOptimalDatabase([])).toThrow();
  });

  it('should skip unavailable databases', () => {
    const configs: DatabaseConfig[] = [
      makeDb({ type: 'sqlite', available: true, mode: 'in-memory' }),
      makeDb({ type: 'postgresql', available: false, mode: 'real' }),
    ];

    const result = getOptimalDatabase(configs);
    expect(result.type).toBe('sqlite');
  });
});
