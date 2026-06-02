import { GraduationCap } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-blue-500/5 dark:to-blue-900/10 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Logo and brand */}
      <div className="mb-8 flex flex-col items-center gap-3 relative z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            SQL <span className="text-blue-600">{t('app.title').replace('SQL ', '')}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('app.subtitle')}</p>
        </div>
      </div>

      {/* Auth form */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
