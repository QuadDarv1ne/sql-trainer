/**
 * Route protection decision logic — extracted from middleware for testability.
 *
 * Returns a decision for a given session + pathname combination:
 * - { action: 'allow' } — proceed
 * - { action: 'redirect', url: '/login?callbackUrl=...' } — needs auth
 * - { action: 'redirect', url: '/' } — insufficient role or already authed on auth page
 */
import type { Role } from '@/lib/rbac';

const protectedRoutes = ['/profile'];
const roleProtectedRoutes: Record<string, Role[]> = {
  '/admin': ['admin'],
  '/teacher': ['teacher', 'admin'],
};
const authRoutes = ['/login', '/register', '/reset-password'];

type Session = { user: { role?: Role } } | null;

export function evaluateRouteAccess(session: Session, pathname: string): { action: 'allow' | 'redirect'; url: string } {
  // Redirect authenticated users away from auth pages
  if (authRoutes.includes(pathname) && session) {
    return { action: 'redirect', url: '/' };
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
    return { action: 'redirect', url: `/login?callbackUrl=${encodeURIComponent(pathname)}` };
  }

  // Role-based route protection
  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      if (!session) {
        return { action: 'redirect', url: `/login?callbackUrl=${encodeURIComponent(pathname)}` };
      }
      const userRole = session.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return { action: 'redirect', url: '/' };
      }
    }
  }

  return { action: 'allow', url: '' };
}
