import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  it('error calls console.error with prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test message');
    expect(spy).toHaveBeenCalledWith('[ERROR] test message', '');
    spy.mockRestore();
  });

  it('error includes error object when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('fail');
    logger.error('test', err);
    expect(spy).toHaveBeenCalledWith('[ERROR] test', err);
    spy.mockRestore();
  });

  it('warn calls console.warn with prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warn');
    expect(spy).toHaveBeenCalledWith('[WARN] test warn');
    spy.mockRestore();
  });

  it('info calls console.info with prefix', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test info');
    expect(spy).toHaveBeenCalledWith('[INFO] test info');
    spy.mockRestore();
  });
});
