import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold">
          SQL <span className="text-emerald-600">Тренажёр</span>
        </h1>
      </div>
      {children}
    </div>
  );
}
