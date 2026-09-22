import { Skeleton } from "@/components/ui/Skeleton";

// Shown immediately on tap, before the ticket data arrives — without this, the old list page
// just sits frozen until the fetch resolves, which is what reads as "slow" and "no animation."
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        กำลังโหลดรายละเอียด...
      </div>

      <Skeleton className="h-4 w-28" index={0} />

      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-20 rounded-full" index={1} />
        <Skeleton className="h-7 w-2/3" index={2} />
        <Skeleton className="h-4 w-24" index={3} />
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-20" index={4 + i} />
            <Skeleton className="h-4 w-32" index={4 + i} />
          </div>
        ))}
        <Skeleton className="h-16 w-full rounded-xl" index={8} />
      </div>

      <Skeleton className="h-40 w-full rounded-3xl border border-neutral-200 shadow-sm" index={9} />
    </main>
  );
}
