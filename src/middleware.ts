import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { Role } from '@/lib/rbac';

// Routes that require authentication
const protectedRoutes = ['/profile', '/app'];

// Routes that require specific roles
const roleProtectedRoutes: Record<string, Role[]> = {
  '/admin': ['admin'],
  '/teacher': ['teacher', 'admin'],
};

// Routes that should redirect to /app if already authenticated
const authRoutes = ['/login', '/register', '/reset-password'];

const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
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
    "upgrade-insecure-requests",
  ].join('; '),
};

export default auth(async (request) => {
  const pathname = request.nextUrl.pathname;
  const session = await auth();

  // Redirect authenticated users away from auth pages to workspace
  if (authRoutes.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      const userRole = (session.user as { role?: Role })?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/app', request.url));
      }
    }
  }

  const response = NextResponse.next();

  // Apply security headers to all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
