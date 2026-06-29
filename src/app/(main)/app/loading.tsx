import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="flex h-full">
      <div className="hidden w-64 flex-col border-r p-4 lg:flex">
        <Skeleton className="mb-4 h-8 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <Skeleton className="mb-4 h-[300px] w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  );
}
