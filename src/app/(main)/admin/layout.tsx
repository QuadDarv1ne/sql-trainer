'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import type { Role } from '@/lib/rbac';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole !== 'admin') {
      router.push('/app');
      return;
    }
    setAuthorized(true);
  }, [session, status, router]);

  if (status === 'loading' || !authorized) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
