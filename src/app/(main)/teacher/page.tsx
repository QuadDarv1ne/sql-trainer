'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StudentProgress from '@/components/teacher/student-progress';
import type { Role } from '@/lib/rbac';

export default function TeacherPage() {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <h1 className="text-3xl font-bold">Панель преподавателя</h1>
      <StudentProgress />
    </div>
  );
}
