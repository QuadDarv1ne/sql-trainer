import { Loader2 } from 'lucide-react';

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8 shadow-sm">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
