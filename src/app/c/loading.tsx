// Shown immediately when navigating to the dashboard (e.g. tapping "back") while ticket data
// is still being fetched.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 animate-pulse flex-col gap-6 px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 rounded-lg bg-neutral-200" />
          <div className="h-4 w-28 rounded-lg bg-neutral-100" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-neutral-200 bg-white shadow-sm" />
        ))}
      </div>

      <div className="h-11 w-full rounded-xl bg-neutral-100" />

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-neutral-200 bg-white shadow-sm" />
        ))}
      </div>
    </main>
  );
}
