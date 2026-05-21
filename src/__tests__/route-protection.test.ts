import { describe, it, expect } from 'vitest';
import { evaluateRouteAccess } from '@/lib/route-protection';
import type { Role } from '@/lib/rbac';

function makeSession(role?: Role) {
  return role ? { user: { role } } : null;
}

describe('evaluateRouteAccess - auth routes', () => {
  it('allows unauthenticated access to /login', () => {
    const result = evaluateRouteAccess(null, '/login');
    expect(result.action).toBe('allow');
  });

  it('redirects authenticated users away from /login', () => {
    const result = evaluateRouteAccess(makeSession('student'), '/login');
    expect(result.action).toBe('redirect');
    expect(result.url).toBe('/');
  });

  it('redirects authenticated users away from /register', () => {
    const result = evaluateRouteAccess(makeSession('teacher'), '/register');
    expect(result.action).toBe('redirect');
  });

  it('redirects authenticated users away from /reset-password', () => {
    const result = evaluateRouteAccess(makeSession('admin'), '/reset-password');
    expect(result.action).toBe('redirect');
  });
});

describe('evaluateRouteAccess - protected routes', () => {
  it('redirects unauthenticated users from /profile to login', () => {
    const result = evaluateRouteAccess(null, '/profile');
    expect(result.action).toBe('redirect');
    expect(result.url).toContain('/login');
    expect(result.url).toContain('callbackUrl');
  });

  it('redirects unauthenticated users from /profile/settings to login', () => {
    const result = evaluateRouteAccess(null, '/profile/settings');
    expect(result.action).toBe('redirect');
    expect(result.url).toContain('callbackUrl');
    expect(decodeURIComponent(result.url)).toContain('/profile/settings');
  });

  it('allows authenticated users to access /profile', () => {
    const result = evaluateRouteAccess(makeSession('student'), '/profile');
    expect(result.action).toBe('allow');
  });
});

describe('evaluateRouteAccess - admin routes', () => {
  it('redirects unauthenticated users from /admin to login', () => {
    const result = evaluateRouteAccess(null, '/admin');
    expect(result.action).toBe('redirect');
    expect(result.url).toContain('/login');
  });

  it('allows admin to access /admin', () => {
    const result = evaluateRouteAccess(makeSession('admin'), '/admin');
    expect(result.action).toBe('allow');
  });

  it('allows admin to access /admin sub-routes', () => {
    const result = evaluateRouteAccess(makeSession('admin'), '/admin/users');
    expect(result.action).toBe('allow');
  });

  it('redirects student from /admin to home', () => {
    const result = evaluateRouteAccess(makeSession('student'), '/admin');
    expect(result.action).toBe('redirect');
    expect(result.url).toBe('/');
  });

  it('redirects teacher from /admin to home', () => {
    const result = evaluateRouteAccess(makeSession('teacher'), '/admin');
    expect(result.action).toBe('redirect');
    expect(result.url).toBe('/');
  });

  it('redirects session without role from /admin to home', () => {
    const result = evaluateRouteAccess({ user: {} } as { user: { role?: Role } }, '/admin');
    expect(result.action).toBe('redirect');
    expect(result.url).toBe('/');
  });
});

describe('evaluateRouteAccess - teacher routes', () => {
  it('allows teacher to access /teacher', () => {
    const result = evaluateRouteAccess(makeSession('teacher'), '/teacher');
    expect(result.action).toBe('allow');
  });

  it('allows admin to access /teacher', () => {
    const result = evaluateRouteAccess(makeSession('admin'), '/teacher');
    expect(result.action).toBe('allow');
  });

  it('redirects student from /teacher to home', () => {
    const result = evaluateRouteAccess(makeSession('student'), '/teacher');
    expect(result.action).toBe('redirect');
    expect(result.url).toBe('/');
  });

  it('allows teacher to access /teacher sub-routes', () => {
    const result = evaluateRouteAccess(makeSession('teacher'), '/teacher/students');
    expect(result.action).toBe('allow');
  });
});

describe('evaluateRouteAccess - public routes', () => {
  it('allows anyone to access /', () => {
    expect(evaluateRouteAccess(null, '/').action).toBe('allow');
    expect(evaluateRouteAccess(makeSession('student'), '/').action).toBe('allow');
  });

  it('allows anyone to access unprotected pages', () => {
    expect(evaluateRouteAccess(null, '/about').action).toBe('allow');
    expect(evaluateRouteAccess(makeSession('student'), '/about').action).toBe('allow');
  });
});
