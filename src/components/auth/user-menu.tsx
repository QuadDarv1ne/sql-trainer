'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import RoleBadge from '@/components/auth/role-badge';
import { User, LayoutDashboard, LogOut, Settings, Shield, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import type { Role } from '@/lib/rbac';

export default function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  const initials = session.user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const userRole = (session.user as { role?: Role })?.role || 'student';
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher' || isAdmin;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{session.user.name}</span>
              <RoleBadge role={userRole} size="sm" />
            </div>
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(isAdmin || isTeacher) && (
          <>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('userMenu.admin')}
                </Link>
              </DropdownMenuItem>
            )}
            {isTeacher && (
              <DropdownMenuItem asChild>
                <Link href="/teacher" className="cursor-pointer flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {t('userMenu.teacher')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('userMenu.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile#security" className="cursor-pointer flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('userMenu.security')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app" className="cursor-pointer flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {t('userMenu.trainer')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
          onClick={() => {
            signOut({ redirect: false });
            router.push('/login');
          }}
        >
          <LogOut className="h-4 w-4" />
          {t('userMenu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
