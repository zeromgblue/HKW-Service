import { Skeleton } from "@/components/ui/Skeleton";

// A blank sheet of paper that fills in, so opening a report feels like the document loading.
export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[210mm] flex-col gap-3">
        <Skeleton className="h-4 w-32" index={0} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-10 w-52 rounded-xl" index={1} />
          <Skeleton className="h-10 w-64 max-w-full rounded-xl" index={2} />
        </div>
      </div>

      <div className="flex w-full max-w-[210mm] flex-col gap-5 rounded-sm bg-white p-5 shadow-lg ring-1 ring-neutral-200 sm:p-10">
        <div className="flex items-center gap-4 border-b-2 border-neutral-100 pb-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" index={3} />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-40" index={4} />
            <Skeleton className="h-6 w-56 max-w-full" index={5} />
            <Skeleton className="h-4 w-36" index={6} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" index={7 + i} />
          ))}
        </div>
        <Skeleton className="h-8 w-full" index={11} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" index={12 + i} />
        ))}
        <div className="grid grid-cols-5 gap-4">
          <Skeleton className="col-span-3 h-32" index={16} />
          <Skeleton className="col-span-2 h-32" index={17} />
        </div>
      </div>
    </main>
  );
}
