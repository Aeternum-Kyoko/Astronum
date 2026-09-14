"use client";

import { useCallback } from "react";
import { NAKSHATRA_REFERENCE } from "@/lib/astrology/reference/nakshatras";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function NakshatrasExplorer() {
  const getSearchText = useCallback(
    (n: (typeof NAKSHATRA_REFERENCE)[number]) => `${n.name} ${n.rulingPlanet} ${n.deity} ${n.keynote}`,
    []
  );
  const { query, setQuery, filtered } = useTextFilter(NAKSHATRA_REFERENCE, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search nakshatras (e.g. Rohini, Ketu, deity)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {filtered.map((n) => (
            <article key={n.name} id={n.name} className="card-edge scroll-mt-24 rounded-2xl p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-gold-bright">
                  {n.index + 1}. {n.name}
                </h2>
                <span className="text-xs text-muted">{n.rulingPlanet}</span>
              </div>
              <p className="mt-1 text-xs tracking-wide text-muted uppercase">{n.degreeSpan}</p>
              <p className="mt-3 text-sm leading-relaxed text-cream">{n.keynote}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                <p>
                  <span className="text-cream">Deity:</span> {n.deity}
                </p>
                <p>
                  <span className="text-cream">Symbol:</span> {n.symbol}
                </p>
                <p>
                  <span className="text-cream">Gana:</span> {n.gana}
                </p>
                <p>
                  <span className="text-cream">Nature:</span> {n.nature}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
