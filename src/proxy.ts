import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import {
  generateCsrfTokenEdge,
  validateCsrfTokenEdge,
  isCsrfProtectedMethod,
  getCookieFromHeader,
  CSRF_COOKIE_NAME,
} from '@/lib/csrf';
import { evaluateRouteAccess } from '@/lib/route-protection';
import { logger } from '@/lib/logger';

// API routes that handle state-changing operations and need CSRF validation
const csrfProtectedApiPrefixes = [
  '/api/admin',
  '/api/user',
  '/api/teacher',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/verify-reset',
  '/api/push',
  '/api/sql',
];

function getSecurityHeaders(nonce?: string): Record<string, string> {
  const isDev = process.env.NODE_ENV === 'development';

  return {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Content-Security-Policy': isDev
      ? "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src *; media-src *; object-src *; frame-src *; base-uri *; form-action *; frame-ancestors *"
      : [
          "default-src 'self'",
          `script-src 'self' 'nonce-${nonce}'`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "media-src 'none'",
          "object-src 'none'",
          "frame-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          'upgrade-insecure-requests',
        ].join('; '),
  };
}

function isCsrfProtectedRoute(pathname: string): boolean {
  return csrfProtectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default auth(async (request) => {
  const pathname = request.nextUrl.pathname;

  // request.auth is already populated by the auth() proxy wrapper
  // — no need for a redundant auth() call
  const session = request.auth;

  // CSRF validation for state-changing API requests
  if (isCsrfProtectedRoute(pathname) && isCsrfProtectedMethod(request.method)) {
    const isValid = validateCsrfTokenEdge(request);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'CSRF validation failed' }, { status: 403 });
    }
  }

  // Route access evaluation (single source of truth)
  const decision = evaluateRouteAccess(session, pathname);
  if (decision.action === 'redirect') {
    return NextResponse.redirect(new URL(decision.url, request.url));
  }

  const requestId = crypto.randomUUID().slice(0, 12);

  // Generate a per-request nonce for CSP script-src (replaces unsafe-inline in prod)
  const nonce = crypto.randomUUID().replace(/-/g, '');

  const response = NextResponse.next();

  // Inject request ID for traceability across logs and client debugging
  response.headers.set('X-Request-Id', requestId);

  // Expose nonce to client-side scripts via meta tag attribute
  // Next.js reads this header and injects <meta nonce="..."> into <head>
  response.headers.set('X-Nonce', nonce);

  // Generate CSRF token for authenticated requests only when missing
  // Use a flag to avoid regenerating on every request which breaks multi-tab usage
  if (session) {
    const existingCsrfCookie = getCookieFromHeader(request, `${CSRF_COOKIE_NAME}-raw`);
    if (!existingCsrfCookie) {
      try {
        const { rawToken, setCookieHeaders } = await generateCsrfTokenEdge();
        response.headers.set('X-CSRF-Token', rawToken);
        for (const cookieHeader of setCookieHeaders) {
          response.headers.append('Set-Cookie', cookieHeader);
        }
      } catch {
        // CSRF token generation is non-critical; allow request to proceed
        logger.warn('Failed to generate CSRF token, proceeding without it');
      }
    }
  }

  // Apply security headers to all responses
  const securityHeaders = getSecurityHeaders(nonce);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|ico|woff|woff2|ttf|eot|map)$).*)',
  ],
};
