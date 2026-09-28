/** Skeleton shown while a server-rendered page computes (Panchang, horoscopes, festivals, tools). */
export default function PageLoading() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:py-20" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-4 w-40 skeleton rounded" />
      <div className="mt-4 h-10 w-2/3 skeleton rounded" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-32 skeleton rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
