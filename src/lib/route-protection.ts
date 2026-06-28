/**
 * Route protection decision logic — single source of truth for middleware.
 *
 * Returns a decision for a given session + pathname combination:
 * - { action: 'allow' } — proceed
 * - { action: 'redirect', url: '/login?callbackUrl=...' } — needs auth
 * - { action: 'redirect', url: '/dashboard' | '/teacher' | '/admin' } — role-based landing
 * - { action: 'redirect', url: '/app' } — insufficient role
 */
import type { Role } from '@/lib/rbac';

const protectedRoutes = ['/profile', '/app'];
const roleProtectedRoutes: Record<string, Role[]> = {
  '/admin': ['admin'],
  '/teacher': ['teacher', 'admin'],
};
const authRoutes = ['/login', '/register', '/reset-password'];

type Session = { user: { role?: Role; email?: string } } | null;

function getLandingPage(role?: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    default:
      return '/dashboard';
  }
}

export function evaluateRouteAccess(session: Session, pathname: string): { action: 'allow' | 'redirect'; url: string } {
  // Redirect authenticated users away from auth pages to their role landing
  if (authRoutes.includes(pathname) && session) {
    return { action: 'redirect', url: getLandingPage(session.user?.role) };
  }

  // Redirect unauthenticated users to login for protected routes
  if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/')) && !session) {
    return {
      action: 'redirect',
      url: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
    };
  }

  // Role-based route protection
  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      if (!session) {
        return {
          action: 'redirect',
          url: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
        };
      }
      const userRole = session.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return { action: 'redirect', url: '/app' };
      }
    }
  }

  // Students accessing /app should go to dashboard instead
  if (pathname === '/app' && session?.user?.role === 'student') {
    return { action: 'redirect', url: '/dashboard' };
  }

  return { action: 'allow', url: '' };
}
