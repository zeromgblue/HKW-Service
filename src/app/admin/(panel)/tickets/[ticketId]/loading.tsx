import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 sm:px-5 sm:py-7">
      <Skeleton className="h-4 w-36" index={0} />

      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24 rounded-full" index={1} />
        <Skeleton className="h-8 w-3/4" index={2} />
        <Skeleton className="h-4 w-28" index={3} />
      </div>

      <Skeleton className="h-80 rounded-3xl border border-neutral-200 shadow-sm" index={4} />
      <Skeleton className="h-40 rounded-3xl border border-neutral-200 shadow-sm" index={5} />
    </main>
  );
}
