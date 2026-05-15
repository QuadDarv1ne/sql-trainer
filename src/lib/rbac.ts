export type Role = 'student' | 'teacher' | 'admin';

export const ROLE_HIERARCHY: Record<Role, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const ROLE_PERMISSIONS: Record<string, Role[]> = {
  '/admin': ['admin'],
  '/teacher': ['teacher', 'admin'],
};

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

export const ROLE_COLORS: Record<Role, string> = {
  student: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  teacher: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function checkRoutePermission(userRole: Role, pathname: string): boolean {
  for (const [route, allowedRoles] of Object.entries(ROLE_PERMISSIONS)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return allowedRoles.includes(userRole);
    }
  }
  return true; // No specific permission required
}
