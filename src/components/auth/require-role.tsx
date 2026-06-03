'use client';

import { useSession } from 'next-auth/react';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Role } from '@/lib/rbac';
import { hasRole, ROLE_LABELS } from '@/lib/rbac';
import { t } from '@/lib/i18n';

interface RequireRoleProps {
  /** Minimum role required to view the content */
  role: Role;
  /** Content shown to authorized users */
  children: React.ReactNode;
  /** Optional custom fallback when access is denied */
  fallback?: React.ReactNode;
  /** If true, show nothing (not even an error message) when unauthorized */
  silent?: boolean;
}

export default function RequireRole({ role: requiredRole, children, fallback, silent = false }: RequireRoleProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: Role })?.role || 'student';

  if (hasRole(userRole as Role, requiredRole)) {
    return <>{children}</>;
  }

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  return (
    <Alert variant="destructive" className="my-4">
      <ShieldAlert className="h-4 w-4" />
      <AlertDescription>
        {t('access.denied', {
          default: `Доступ ограничен. Требуется роль: ${ROLE_LABELS[requiredRole]}`,
        })}
      </AlertDescription>
    </Alert>
  );
}
