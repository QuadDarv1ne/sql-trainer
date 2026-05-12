'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginFormInner from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
