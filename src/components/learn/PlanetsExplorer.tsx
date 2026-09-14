"use client";

import { useCallback } from "react";
import { PLANET_REFERENCE } from "@/lib/astrology/reference/planets";
import { HOUSE_SIGNIFICATION } from "@/lib/astrology/content";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function PlanetsExplorer() {
  const getSearchText = useCallback(
    (p: (typeof PLANET_REFERENCE)[number]) => `${p.name} ${p.sanskrit} ${p.significations}`,
    []
  );
  const { query, setQuery, filtered } = useTextFilter(PLANET_REFERENCE, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search planets (e.g. Saturn, Guru, wealth)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {filtered.map((p) => (
            <article key={p.name} id={p.name} className="card-edge scroll-mt-24 rounded-3xl p-7 md:p-9">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl text-gold-bright">
                  {p.name} <span className="text-base text-muted">· {p.sanskrit}</span>
                </h2>
                <span className="text-xs tracking-wide text-muted uppercase">{p.nature}</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-cream">{p.significations}</p>

              <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-ink-deep/40 p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Dignity</p>
                  <dl className="mt-2 space-y-1 text-muted">
                    <div>
                      <dt className="inline text-cream">Exalted:</dt> <dd className="inline">{p.exaltationSign ?? "Not assigned"}</dd>
                    </div>
                    <div>
                      <dt className="inline text-cream">Debilitated:</dt> <dd className="inline">{p.debilitationSign ?? "Not assigned"}</dd>
                    </div>
                    <div>
                      <dt className="inline text-cream">Own sign(s):</dt>{" "}
                      <dd className="inline">{p.ownSigns.length > 0 ? p.ownSigns.join(", ") : "Not assigned"}</dd>
                    </div>
                    {p.moolatrikona && (
                      <div>
                        <dt className="inline text-cream">Moolatrikona:</dt>{" "}
                        <dd className="inline">
                          {p.moolatrikona.sign} {p.moolatrikona.fromDegree}°–{p.moolatrikona.toDegree}°
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="rounded-xl border border-border/60 bg-ink-deep/40 p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Relationships & Dasha</p>
                  <dl className="mt-2 space-y-1 text-muted">
                    <div>
                      <dt className="inline text-cream">Friends:</dt> <dd className="inline">{p.friends.join(", ") || "—"}</dd>
                    </div>
                    <div>
                      <dt className="inline text-cream">Enemies:</dt> <dd className="inline">{p.enemies.join(", ") || "—"}</dd>
                    </div>
                    <div>
                      <dt className="inline text-cream">Neutral:</dt> <dd className="inline">{p.neutral.join(", ") || "—"}</dd>
                    </div>
                    <div>
                      <dt className="inline text-cream">Vimshottari years:</dt>{" "}
                      <dd className="inline">{p.dashaYears ?? "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">{p.name} in each house</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {p.inHouses.map((text, i) => (
                    <div key={i} className="rounded-lg border border-border/40 px-3 py-2 text-xs text-muted">
                      <span className="font-semibold text-gold-bright">House {i + 1}</span>{" "}
                      <span className="text-muted/70">({HOUSE_SIGNIFICATION[i + 1]})</span> — {text}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
