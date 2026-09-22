import { Skeleton } from "@/components/ui/Skeleton";

// Shown immediately when navigating to the dashboard (e.g. tapping "back") while ticket data
// is still being fetched.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" index={0} />
          <Skeleton className="h-4 w-28" index={1} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          กำลังโหลด...
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl border border-neutral-200 shadow-sm" index={2 + i} />
        ))}
      </div>

      <Skeleton className="h-11 w-full rounded-xl" index={5} />

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl border border-neutral-200 shadow-sm" index={6 + i} />
        ))}
      </div>
    </main>
  );
}
