"use client";

import { useCallback } from "react";
import { HOUSE_REFERENCE } from "@/lib/astrology/reference/houses";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function HousesExplorer() {
  const getSearchText = useCallback(
    (h: (typeof HOUSE_REFERENCE)[number]) => `${h.house} ${h.sanskritName} ${h.classification.join(" ")} ${h.description}`,
    []
  );
  const { query, setQuery, filtered } = useTextFilter(HOUSE_REFERENCE, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search houses (e.g. 7th, Kendra, marriage)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filtered.map((h) => (
            <article key={h.house} id={`house-${h.house}`} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-gold-bright">
                  House {h.house} <span className="text-sm text-muted">· {h.sanskritName}</span>
                </h2>
                <span className="text-xs text-muted">{h.karaka.join(", ")}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {h.classification.map((c) => (
                  <span key={c} className="rounded-full border border-gold/30 px-2 py-0.5 text-[10px] tracking-wide text-gold-bright uppercase">
                    {c}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-cream">{h.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
