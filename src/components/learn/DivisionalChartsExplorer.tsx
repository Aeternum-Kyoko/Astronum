"use client";

import { useCallback } from "react";
import { DIVISIONAL_CHART_REFERENCE } from "@/lib/astrology/reference/divisionalCharts";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function DivisionalChartsExplorer() {
  const getSearchText = useCallback(
    (v: (typeof DIVISIONAL_CHART_REFERENCE)[number]) => `${v.key} ${v.title} ${v.blurb} ${v.description}`,
    []
  );
  const { query, setQuery, filtered } = useTextFilter(DIVISIONAL_CHART_REFERENCE, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search charts (e.g. D9, career, marriage)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filtered.map((v) => (
            <article key={v.key} id={v.key} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-gold-bright">
                  {v.key} <span className="text-sm text-muted">· {v.title}</span>
                </h2>
                <span className="text-xs text-muted">÷{v.divisions}</span>
              </div>
              <p className="mt-1 text-xs tracking-wide text-gold uppercase">{v.blurb}</p>
              <p className="mt-3 text-sm leading-relaxed text-cream">{v.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
