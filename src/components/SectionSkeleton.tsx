/** Placeholder while a kundli section loads: the shape of what's coming, shimmering. */
export default function SectionSkeleton({ label = "Loading this section…" }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="skeleton mx-auto h-4 w-2/3 max-w-lg rounded" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card-edge space-y-3 rounded-2xl p-6">
            <div className="skeleton h-5 w-1/2 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
