import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-emerald-500/5 dark:to-emerald-900/10 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      {/* Logo and brand */}
      <div className="mb-8 flex flex-col items-center gap-3 relative z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            SQL <span className="text-emerald-600">Тренажёр</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Интерактивное обучение SQL</p>
        </div>
      </div>

      {/* Auth form */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
