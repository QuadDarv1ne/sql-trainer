import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('error calls console.error with structured JSON', () => {
    logger.error('test message');
    expect(errorSpy).toHaveBeenCalledOnce();
    const output = errorSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('test message');
    expect(parsed.timestamp).toBeDefined();
  });

  it('error serializes Error objects with name and message', () => {
    const err = new Error('something broke');
    logger.error('operation failed', err);
    const output = errorSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.error.name).toBe('Error');
    expect(parsed.error.message).toBe('something broke');
  });

  it('warn calls console.warn with structured JSON', () => {
    logger.warn('test warn');
    expect(warnSpy).toHaveBeenCalledOnce();
    const output = warnSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe('warn');
    expect(parsed.message).toBe('test warn');
  });

  it('info calls console.info with structured JSON', () => {
    logger.info('test info');
    expect(infoSpy).toHaveBeenCalledOnce();
    const output = infoSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test info');
  });

  it('debug calls console.debug with structured JSON', () => {
    logger.debug('test debug');
    expect(debugSpy).toHaveBeenCalledOnce();
    const output = debugSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe('debug');
    expect(parsed.message).toBe('test debug');
  });

  it('child logger includes context field', () => {
    const child = logger.child('my-module');
    child.info('hello');
    const output = infoSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.context).toBe('my-module');
    expect(parsed.message).toBe('hello');
  });

  it('child logger merges extra fields', () => {
    const child = logger.child('auth', { userId: '123' });
    child.info('login', { ip: '127.0.0.1' });
    const output = infoSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.context).toBe('auth');
    expect(parsed.userId).toBe('123');
    expect(parsed.ip).toBe('127.0.0.1');
    expect(parsed.message).toBe('login');
  });

  it('error handles non-Error objects gracefully', () => {
    logger.error('string error', 'raw string');
    expect(errorSpy).toHaveBeenCalledOnce();
    const output = errorSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.error.message).toBe('raw string');
  });

  it('error handles null error gracefully', () => {
    logger.error('null error', null);
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('warn includes extra fields when provided', () => {
    logger.warn('rate limited', { key: 'user:123', remaining: 0 });
    expect(warnSpy).toHaveBeenCalledOnce();
    const output = warnSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.key).toBe('user:123');
    expect(parsed.remaining).toBe(0);
  });

  it('info includes extra fields when provided', () => {
    logger.info('request completed', { method: 'GET', path: '/api/health', duration: 42 });
    expect(infoSpy).toHaveBeenCalledOnce();
    const output = infoSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.method).toBe('GET');
    expect(parsed.path).toBe('/api/health');
    expect(parsed.duration).toBe(42);
  });
});
