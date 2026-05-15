'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Role } from '@/lib/rbac';

export default function TeacherGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const authorized = useMemo(() => {
    if (status === 'loading') return false;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole !== 'teacher' && userRole !== 'admin') {
      router.push('/');
      return false;
    }
    return true;
  }, [session, status, router]);

  if (!authorized) return null;
  return <>{children}</>;
}
