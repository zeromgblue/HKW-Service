import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-5 sm:py-7">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" index={0} />
        <Skeleton className="h-4 w-64" index={1} />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" index={2 + i} />
        ))}
      </div>

      <Skeleton className="h-11 w-full rounded-xl" index={5} />

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl border border-neutral-200 shadow-sm" index={6 + i} />
        ))}
      </div>
    </main>
  );
}
