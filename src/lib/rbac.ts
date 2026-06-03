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

// Pre-compiled route prefix -> minimum required role level for O(1) lookup
const ROUTE_MIN_ROLES: [string, number][] = Object.entries(ROLE_PERMISSIONS).map(([route, roles]) => [
  route,
  Math.min(...roles.map((r) => ROLE_HIERARCHY[r])),
]);

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
  const userLevel = ROLE_HIERARCHY[userRole];
  for (const [route, minRoleLevel] of ROUTE_MIN_ROLES) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return userLevel >= minRoleLevel;
    }
  }
  return true; // No specific permission required
}

// ==================== Feature-Based Permissions ====================

export const FEATURES = {
  manage_users: 'manage_users',
  manage_roles: 'manage_roles',
  ban_users: 'ban_users',
  view_audit: 'view_audit',
  manage_deadlines: 'manage_deadlines',
  view_analytics: 'view_analytics',
  export_data: 'export_data',
  manage_groups: 'manage_groups',
  notify_students: 'notify_students',
  view_student_details: 'view_student_details',
  view_all_progress: 'view_all_progress',
  edit_tasks: 'edit_tasks',
  view_leaderboard: 'view_leaderboard',
  access_workspace: 'access_workspace',
  view_own_progress: 'view_own_progress',
  receive_notifications: 'receive_notifications',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

export const ROLE_FEATURE_PERMISSIONS: Record<Role, Feature[]> = {
  student: [
    FEATURES.access_workspace,
    FEATURES.view_own_progress,
    FEATURES.view_leaderboard,
    FEATURES.receive_notifications,
  ],
  teacher: [
    FEATURES.access_workspace,
    FEATURES.view_own_progress,
    FEATURES.view_leaderboard,
    FEATURES.receive_notifications,
    FEATURES.manage_groups,
    FEATURES.notify_students,
    FEATURES.view_student_details,
    FEATURES.view_all_progress,
    FEATURES.manage_deadlines,
    FEATURES.view_analytics,
  ],
  admin: Object.values(FEATURES),
};

export function hasFeature(userRole: Role, feature: Feature): boolean {
  const allowed = ROLE_FEATURE_PERMISSIONS[userRole];
  return allowed.includes(feature);
}

export function getRoleFeatures(role: Role): Feature[] {
  return ROLE_FEATURE_PERMISSIONS[role];
}

export function assertFeature(userRole: Role, feature: Feature): void {
  if (!hasFeature(userRole, feature)) {
    throw new ForbiddenError(`Feature "${feature}" requires higher privileges`);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
