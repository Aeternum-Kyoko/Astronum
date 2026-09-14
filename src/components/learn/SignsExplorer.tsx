"use client";

import { useCallback } from "react";
import { SIGN_REFERENCE } from "@/lib/astrology/reference/signs";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function SignsExplorer() {
  const getSearchText = useCallback(
    (s: (typeof SIGN_REFERENCE)[number]) => `${s.name} ${s.sanskrit} ${s.element} ${s.quality} ${s.description}`,
    []
  );
  const { query, setQuery, filtered } = useTextFilter(SIGN_REFERENCE, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search signs (e.g. Scorpio, fire, movable)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filtered.map((s) => (
            <article key={s.name} id={s.name} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-gold-bright">
                  {s.name} <span className="text-sm text-muted">· {s.sanskrit}</span>
                </h2>
                <span className="text-xs text-muted">{s.rulingPlanet}</span>
              </div>
              <p className="mt-1 text-xs tracking-wide text-muted uppercase">
                {s.element} · {s.quality}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cream">{s.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted">
                <p>
                  <span className="text-cream">Body:</span> {s.bodyPart}
                </p>
                <p>
                  <span className="text-cream">Keynote:</span> {s.keynote}
                </p>
                <p className="col-span-2">
                  <span className="text-cream">Harmonious with:</span> {s.harmoniousWith.join(", ")}
                </p>
                <p className="col-span-2">
                  <span className="text-cream">Challenging with:</span> {s.challengingWith.join(", ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
