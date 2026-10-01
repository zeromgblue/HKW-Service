import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 sm:py-7">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-24" index={0} />
        <Skeleton className="h-4 w-72 max-w-full" index={1} />
      </div>

      <Skeleton className="h-28 rounded-2xl border border-neutral-200 shadow-sm" index={2} />

      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-5 w-36" index={3} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl border border-neutral-200 shadow-sm" index={4 + i} />
        ))}
      </div>
    </main>
  );
}
