/** Skeleton loading placeholders for vault data panels. */
export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 space-y-3">
          <div className="skeleton-line w-3/4" />
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton-line w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="skeleton-line w-48" />
        <div className="skeleton-line w-12" />
      </div>
      <div className="skeleton rounded-xl" style={{ height: 140 }} />
    </div>
  );
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="skeleton-line w-40 mb-4" />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <div className="skeleton-line w-24" />
              <div className="skeleton-line w-16" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <div className="skeleton-line w-20" />
            <div className="skeleton-line w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
