import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/rbac';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const colorClass = ROLE_COLORS[role] || ROLE_COLORS.student;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorClass} ${sizeClass}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
