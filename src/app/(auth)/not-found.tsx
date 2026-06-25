import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Link href="/login">
        <Button variant="outline">Back to login</Button>
      </Link>
    </div>
  );
}
