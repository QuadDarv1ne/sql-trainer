import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeFetch, getCsrfToken, csrfHeaders } from '@/lib/safe-fetch';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('safeFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return parsed JSON on successful response', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200, statusText: 'OK' }),
    );

    const result = await safeFetch<typeof mockData>('/api/test');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({}));
  });

  it('should return null on non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    );

    const result = await safeFetch('/api/missing');
    expect(result).toBeNull();
  });

  it('should return null on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await safeFetch('/api/test');
    expect(result).toBeNull();
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const mockData = { success: true };
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('First attempt fails'))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockData), { status: 200, statusText: 'OK' }));

    const result = await safeFetch('/api/test', { maxRetries: 1, retryDelay: 10 });
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should return null after exhausting all retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Always fails'));

    const result = await safeFetch('/api/test', { maxRetries: 2, retryDelay: 10 });
    expect(result).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should call onError callback on failure', async () => {
    const onError = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Boom'));

    await safeFetch('/api/test', { onError });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should add CSRF header for POST requests', async () => {
    const csrfToken = 'test-csrf-123';
    vi.spyOn(document, 'cookie', 'get').mockReturnValue(`csrf-token-raw=${csrfToken}; other=val`);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, statusText: 'OK' }),
    );

    await safeFetch('/api/test', { method: 'POST' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );

    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Headers;
    expect(callHeaders.get('x-csrf-token')).toBe(csrfToken);
  });

  it('should not add CSRF header for GET requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, statusText: 'OK' }),
    );

    await safeFetch('/api/test', { method: 'GET' });

    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Headers;
    expect(callHeaders.get('x-csrf-token')).toBeNull();
  });
});

describe('getCsrfToken', () => {
  it('should read token from cookie', () => {
    vi.spyOn(document, 'cookie', 'get').mockReturnValue('csrf-token-raw=abc123; other=val');
    expect(getCsrfToken()).toBe('abc123');
  });

  it('should return null when cookie not present', () => {
    vi.spyOn(document, 'cookie', 'get').mockReturnValue('');
    expect(getCsrfToken()).toBeNull();
  });

  it('should decode URL-encoded token', () => {
    vi.spyOn(document, 'cookie', 'get').mockReturnValue('csrf-token-raw=test%20token');
    expect(getCsrfToken()).toBe('test token');
  });
});

describe('csrfHeaders', () => {
  it('should include CSRF token header when available', () => {
    vi.spyOn(document, 'cookie', 'get').mockReturnValue('csrf-token-raw=my-token');
    const headers = csrfHeaders({ 'Content-Type': 'application/json' });
    expect(headers.get('x-csrf-token')).toBe('my-token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('should work without initial headers', () => {
    vi.spyOn(document, 'cookie', 'get').mockReturnValue('csrf-token-raw=my-token');
    const headers = csrfHeaders();
    expect(headers.get('x-csrf-token')).toBe('my-token');
  });
});