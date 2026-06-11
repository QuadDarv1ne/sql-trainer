import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { generateCsrfTokenEdge, validateCsrfTokenEdge, isCsrfProtectedMethod, getCookieFromHeader } from '@/lib/csrf';
import { evaluateRouteAccess } from '@/lib/route-protection';

// API routes that handle state-changing operations and need CSRF validation
const csrfProtectedApiPrefixes = [
  '/api/admin',
  '/api/user',
  '/api/teacher',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/verify-reset',
  '/api/push',
  '/api/deadlines',
  '/api/sql',
];

function getSecurityHeaders(): Record<string, string> {
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
          "script-src 'self' 'unsafe-inline'",
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

  // request.auth is already populated by the auth() middleware wrapper
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

  const response = NextResponse.next();

  // Generate CSRF token for authenticated requests only when missing
  // Avoids regenerating on every request which breaks multi-tab usage
  if (session) {
    const existingCsrfCookie = getCookieFromHeader(request, 'csrf-token-raw');
    if (!existingCsrfCookie) {
      const { rawToken, setCookieHeaders } = await generateCsrfTokenEdge();
      response.headers.set('X-CSRF-Token', rawToken);
      for (const cookieHeader of setCookieHeaders) {
        response.headers.append('Set-Cookie', cookieHeader);
      }
    }
  }

  // Apply security headers to all responses
  const securityHeaders = getSecurityHeaders();
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
