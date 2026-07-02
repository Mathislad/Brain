export default function ClientPortalLoading() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <div className="h-3 w-32 animate-pulse rounded bg-zinc-900/60" />
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-900/60" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-900/40" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-900/40" />
        ))}
      </div>
    </div>
  );
}
