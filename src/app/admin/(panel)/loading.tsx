import { Skeleton } from "@/components/ui/Skeleton";

// Shown the instant a menu is tapped, while the overview's data is still being fetched.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 sm:py-7">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-36" index={0} />
        <Skeleton className="h-4 w-56" index={1} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl border border-neutral-200 shadow-sm" index={2 + i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-3xl border border-neutral-200 shadow-sm" index={6} />
        <Skeleton className="h-44 rounded-3xl border border-neutral-200 shadow-sm" index={7} />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl border border-neutral-200 shadow-sm" index={8 + i} />
        ))}
      </div>
    </main>
  );
}
