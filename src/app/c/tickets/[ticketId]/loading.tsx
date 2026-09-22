// Shown immediately on tap, before the ticket data arrives — without this, the old list page
// just sits frozen until the fetch resolves, which is what reads as "slow" and "no animation."
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 animate-pulse flex-col gap-5 px-5 py-8">
      <div className="h-5 w-32 rounded-lg bg-neutral-200" />

      <div className="flex flex-col gap-2">
        <div className="h-5 w-20 rounded-full bg-neutral-200" />
        <div className="h-7 w-2/3 rounded-lg bg-neutral-200" />
        <div className="h-4 w-24 rounded-lg bg-neutral-100" />
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="h-4 w-20 rounded bg-neutral-100" />
            <div className="h-4 w-32 rounded bg-neutral-200" />
          </div>
        ))}
        <div className="h-16 w-full rounded-xl bg-neutral-100" />
      </div>

      <div className="h-40 w-full rounded-3xl border border-neutral-200 bg-white shadow-sm" />
    </main>
  );
}
