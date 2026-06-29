import { describe, it, expect } from 'vitest';
import { getClientIdentifier } from '../lib/rate-limit';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000', { headers });
}

describe('getClientIdentifier', () => {
  it('returns a deterministic hash for the same request', () => {
    const req = makeRequest({ 'user-agent': 'Mozilla/5.0' });
    const id1 = getClientIdentifier(req);
    const id2 = getClientIdentifier(req);
    expect(id1).toBe(id2);
  });

  it('returns user: prefix when userId is provided', () => {
    const req = makeRequest();
    const id = getClientIdentifier(req, 'user-123');
    expect(id).toBe('user:user-123');
  });

  it('userId takes precedence over headers', () => {
    const req = makeRequest({
      'x-forwarded-for': '1.2.3.4',
      'user-agent': 'test',
    });
    const id = getClientIdentifier(req, 'user-42');
    expect(id).toBe('user:user-42');
  });

  it('returns a 16-character hex string for anonymous requests', () => {
    const req = makeRequest({ 'user-agent': 'test-agent' });
    const id = getClientIdentifier(req);
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('produces different IDs for different user-agents', () => {
    const req1 = makeRequest({ 'user-agent': 'Chrome' });
    const req2 = makeRequest({ 'user-agent': 'Firefox' });
    expect(getClientIdentifier(req1)).not.toBe(getClientIdentifier(req2));
  });

  it('produces different IDs for different x-forwarded-for', () => {
    const req1 = makeRequest({ 'x-forwarded-for': '1.1.1.1' });
    const req2 = makeRequest({ 'x-forwarded-for': '2.2.2.2' });
    expect(getClientIdentifier(req1)).not.toBe(getClientIdentifier(req2));
  });

  it('uses x-real-ip when available', () => {
    const req1 = makeRequest({ 'x-real-ip': '10.0.0.1', 'user-agent': 'same' });
    const req2 = makeRequest({ 'x-real-ip': '10.0.0.2', 'user-agent': 'same' });
    expect(getClientIdentifier(req1)).not.toBe(getClientIdentifier(req2));
  });

  it('uses cf-connecting-ip when available', () => {
    const req1 = makeRequest({ 'cf-connecting-ip': '1.1.1.1', 'user-agent': 'same' });
    const req2 = makeRequest({ 'cf-connecting-ip': '2.2.2.2', 'user-agent': 'same' });
    expect(getClientIdentifier(req1)).not.toBe(getClientIdentifier(req2));
  });

  it('handles missing all headers gracefully', () => {
    const req = makeRequest();
    const id = getClientIdentifier(req);
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('handles multiple x-forwarded-for entries by using the first', () => {
    const req1 = makeRequest({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2', 'user-agent': 'same' });
    const req2 = makeRequest({ 'x-forwarded-for': '1.1.1.1, 3.3.3.3', 'user-agent': 'same' });
    // Only the first IP is used, so these should be identical
    expect(getClientIdentifier(req1)).toBe(getClientIdentifier(req2));
  });

  it('differentiates when first x-forwarded-for differs', () => {
    const req1 = makeRequest({ 'x-forwarded-for': '1.1.1.1, 9.9.9.9', 'user-agent': 'same' });
    const req2 = makeRequest({ 'x-forwarded-for': '2.2.2.2, 9.9.9.9', 'user-agent': 'same' });
    expect(getClientIdentifier(req1)).not.toBe(getClientIdentifier(req2));
  });
});
