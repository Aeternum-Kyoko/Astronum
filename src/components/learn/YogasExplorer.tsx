"use client";

import { useCallback } from "react";
import { YOGA_REFERENCE } from "@/lib/astrology/reference/yogas";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function YogasExplorer() {
  const getSearchText = useCallback(
    (y: (typeof YOGA_REFERENCE)[number]) => `${y.name} ${y.category} ${y.definition} ${y.effect}`,
    []
  );
  const { query, setQuery, filtered } = useTextFilter(YOGA_REFERENCE, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search yogas (e.g. Raja Yoga, Kemadruma, dosha)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {filtered.map((y) => (
            <article key={y.name} id={y.name.replace(/\s+/g, "-")} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-display text-lg text-gold-bright">{y.name}</h2>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${
                    y.detectedByEngine ? "border-gold/50 text-gold-bright" : "border-border text-muted"
                  }`}
                >
                  {y.detectedByEngine ? "Detected on your chart" : "Reference only"}
                </span>
              </div>
              <p className="mt-1 text-xs tracking-wide text-muted uppercase">{y.category}</p>
              <p className="mt-3 text-sm leading-relaxed text-cream">{y.definition}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <span className="text-gold">Effect:</span> {y.effect}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
