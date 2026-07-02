export default function DashboardLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 grid gap-3">
        <div className="h-3 w-28 animate-pulse rounded bg-zinc-900/60" />
        <div className="h-7 w-56 animate-pulse rounded bg-zinc-900/60" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-900/40" />
        ))}
      </div>
    </div>
  );
}
