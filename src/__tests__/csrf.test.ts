/**
 * Tests for CSRF protection utilities.
 */
import { describe, it, expect } from 'vitest';
import {
  getCookieFromHeader,
  validateCsrfTokenEdge,
  isCsrfProtectedMethod,
  generateCsrfTokenEdge,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/lib/csrf';

describe('CSRF Utilities', () => {
  describe('getCookieFromHeader', () => {
    it('should return undefined when no cookie header present', () => {
      const request = new Request('http://example.com', {
        headers: {},
      });
      expect(getCookieFromHeader(request, 'csrf-token')).toBeUndefined();
    });

    it('should return undefined when cookie not found', () => {
      const request = new Request('http://example.com', {
        headers: { cookie: 'foo=bar; baz=qux' },
      });
      expect(getCookieFromHeader(request, 'csrf-token')).toBeUndefined();
    });

    it('should return cookie value when found', () => {
      const request = new Request('http://example.com', {
        headers: { cookie: 'csrf-token-raw=abc123; other=value' },
      });
      expect(getCookieFromHeader(request, 'csrf-token-raw')).toBe('abc123');
    });

    it('should handle cookie values with equals signs', () => {
      const request = new Request('http://example.com', {
        headers: { cookie: 'token=abc==def; other=value' },
      });
      expect(getCookieFromHeader(request, 'token')).toBe('abc==def');
    });
  });

  describe('validateCsrfTokenEdge', () => {
    it('should return false when no cookie present', () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        headers: { [CSRF_HEADER_NAME]: 'some-token' },
      });
      expect(validateCsrfTokenEdge(request)).toBe(false);
    });

    it('should return false when no header present', () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        headers: { cookie: `${CSRF_COOKIE_NAME}-raw=some-token` },
      });
      expect(validateCsrfTokenEdge(request)).toBe(false);
    });

    it('should return false when tokens do not match', () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}-raw=cookie-token`,
          [CSRF_HEADER_NAME]: 'header-token',
        },
      });
      expect(validateCsrfTokenEdge(request)).toBe(false);
    });

    it('should return true when tokens match', () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}-raw=matching-token`,
          [CSRF_HEADER_NAME]: 'matching-token',
        },
      });
      expect(validateCsrfTokenEdge(request)).toBe(true);
    });
  });

  describe('isCsrfProtectedMethod', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('should protect %s method', (method) => {
      expect(isCsrfProtectedMethod(method)).toBe(true);
    });

    it.each(['GET', 'HEAD', 'OPTIONS'])('should not protect %s method', (method) => {
      expect(isCsrfProtectedMethod(method)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isCsrfProtectedMethod('post')).toBe(true);
      expect(isCsrfProtectedMethod('Get')).toBe(false);
    });
  });

  describe('generateCsrfTokenEdge', () => {
    it('should generate a raw token and set-cookie headers', async () => {
      const result = await generateCsrfTokenEdge();

      expect(result.rawToken).toBeDefined();
      expect(result.rawToken).toHaveLength(36); // UUID length
      expect(result.setCookieHeaders).toHaveLength(2);
      expect(result.setCookieHeaders[0]).toContain(`${CSRF_COOKIE_NAME}=`);
      expect(result.setCookieHeaders[0]).toContain('HttpOnly');
      expect(result.setCookieHeaders[1]).toContain(`${CSRF_COOKIE_NAME}-raw=`);
      expect(result.setCookieHeaders[1]).not.toContain('HttpOnly');
    });

    it('should generate unique tokens each time', async () => {
      const result1 = await generateCsrfTokenEdge();
      const result2 = await generateCsrfTokenEdge();

      expect(result1.rawToken).not.toBe(result2.rawToken);
    });

    it('should produce tokens that can be validated correctly', async () => {
      const { rawToken, setCookieHeaders } = await generateCsrfTokenEdge();

      // Extract the raw cookie from set-cookie headers
      const rawCookie = setCookieHeaders[1].split(';')[0];

      // Create a request with the cookie and header
      const request = new Request('http://example.com', {
        method: 'POST',
        headers: {
          cookie: rawCookie,
          [CSRF_HEADER_NAME]: rawToken,
        },
      });

      expect(validateCsrfTokenEdge(request)).toBe(true);
    });

    it('should reject mismatched tokens', async () => {
      const { rawToken } = await generateCsrfTokenEdge();

      const request = new Request('http://example.com', {
        method: 'POST',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}-raw=different-token`,
          [CSRF_HEADER_NAME]: rawToken,
        },
      });

      expect(validateCsrfTokenEdge(request)).toBe(false);
    });
  });
});
