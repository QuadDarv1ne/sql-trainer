'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserTable from '@/components/admin/user-table';
import DBStats from '@/components/admin/db-stats';
import type { Role } from '@/lib/rbac';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole !== 'admin') {
      router.push('/');
      return;
    }
    setAuthorized(true);
  }, [session, status, router]);

  if (!authorized) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <h1 className="text-3xl font-bold">Панель администратора</h1>
      <DBStats />
      <UserTable />
    </div>
  );
}
