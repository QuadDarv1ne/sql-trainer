import { describe, it, expect } from 'vitest';
import { hasRole, checkRoutePermission, ROLE_HIERARCHY, ROLE_PERMISSIONS } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

describe('hasRole', () => {
  it('student has student role', () => {
    expect(hasRole('student', 'student')).toBe(true);
  });

  it('student does not have teacher role', () => {
    expect(hasRole('student', 'teacher')).toBe(false);
  });

  it('student does not have admin role', () => {
    expect(hasRole('student', 'admin')).toBe(false);
  });

  it('teacher has student role (hierarchy)', () => {
    expect(hasRole('teacher', 'student')).toBe(true);
  });

  it('teacher has teacher role', () => {
    expect(hasRole('teacher', 'teacher')).toBe(true);
  });

  it('teacher does not have admin role', () => {
    expect(hasRole('teacher', 'admin')).toBe(false);
  });

  it('admin has all roles (hierarchy)', () => {
    const roles: Role[] = ['student', 'teacher', 'admin'];
    for (const required of roles) {
      expect(hasRole('admin', required)).toBe(true);
    }
  });
});

describe('ROLE_HIERARCHY', () => {
  it('has correct ordering', () => {
    expect(ROLE_HIERARCHY.student).toBe(0);
    expect(ROLE_HIERARCHY.teacher).toBe(1);
    expect(ROLE_HIERARCHY.admin).toBe(2);
  });

  it('enforces strict ordering', () => {
    expect(ROLE_HIERARCHY.student < ROLE_HIERARCHY.teacher).toBe(true);
    expect(ROLE_HIERARCHY.teacher < ROLE_HIERARCHY.admin).toBe(true);
  });
});

describe('checkRoutePermission', () => {
  it('student cannot access /admin', () => {
    expect(checkRoutePermission('student', '/admin')).toBe(false);
  });

  it('admin can access /admin', () => {
    expect(checkRoutePermission('admin', '/admin')).toBe(true);
  });

  it('teacher cannot access /admin', () => {
    expect(checkRoutePermission('teacher', '/admin')).toBe(false);
  });

  it('teacher can access /teacher', () => {
    expect(checkRoutePermission('teacher', '/teacher')).toBe(true);
  });

  it('admin can access /teacher', () => {
    expect(checkRoutePermission('admin', '/teacher')).toBe(true);
  });

  it('student cannot access /teacher', () => {
    expect(checkRoutePermission('student', '/teacher')).toBe(false);
  });

  it('allows access to sub-routes for authorized roles', () => {
    expect(checkRoutePermission('admin', '/admin/users')).toBe(true);
    expect(checkRoutePermission('admin', '/admin/settings')).toBe(true);
    expect(checkRoutePermission('teacher', '/teacher/students')).toBe(true);
  });

  it('denies access to sub-routes for unauthorized roles', () => {
    expect(checkRoutePermission('student', '/admin/users')).toBe(false);
    expect(checkRoutePermission('student', '/teacher/students')).toBe(false);
  });

  it('allows access to unprotected routes for all roles', () => {
    expect(checkRoutePermission('student', '/')).toBe(true);
    expect(checkRoutePermission('teacher', '/profile')).toBe(true);
    expect(checkRoutePermission('admin', '/profile')).toBe(true);
  });
});

describe('ROLE_PERMISSIONS', () => {
  it('has expected routes', () => {
    expect(ROLE_PERMISSIONS).toHaveProperty('/admin');
    expect(ROLE_PERMISSIONS).toHaveProperty('/teacher');
  });

  it('admin has access to all protected routes', () => {
    const protectedRoutes = Object.keys(ROLE_PERMISSIONS);
    for (const route of protectedRoutes) {
      expect(ROLE_PERMISSIONS[route]).toContain('admin');
    }
  });
});
