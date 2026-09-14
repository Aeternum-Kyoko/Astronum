"use client";

import { PLANET_REFERENCE } from "@/lib/astrology/reference/planets";
import FilterableList from "./FilterableList";

export default function PlanetsSection() {
  return (
    <FilterableList
      items={PLANET_REFERENCE}
      placeholder="Search planets — e.g. Mars, Saturn, exaltation…"
      match={(p, q) =>
        p.name.toLowerCase().includes(q) ||
        p.sanskrit.toLowerCase().includes(q) ||
        p.significations.toLowerCase().includes(q)
      }
    >
      {(filtered) => (
        <div className="space-y-8">
          {filtered.map((p) => (
            <article key={p.name} id={p.name.toLowerCase()} className="card-edge scroll-mt-24 rounded-2xl p-6 md:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl text-cream">
                  {p.name} <span className="text-base text-muted">({p.sanskrit})</span>
                </h2>
                <span className="rounded-full border border-border/80 px-3 py-1 text-xs text-gold-bright">{p.nature}</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">{p.significations}</p>

              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Dignity</p>
                  <ul className="mt-2 space-y-1 text-cream">
                    <li>Exalted: {p.exaltationSign ?? "—"}</li>
                    <li>Debilitated: {p.debilitationSign ?? "—"}</li>
                    <li>Own sign{p.ownSigns.length > 1 ? "s" : ""}: {p.ownSigns.join(", ") || "—"}</li>
                    {p.moolatrikona && (
                      <li>
                        Moolatrikona: {p.moolatrikona.sign} {p.moolatrikona.fromDegree}°–{p.moolatrikona.toDegree}°
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Relationships & Dasha</p>
                  <ul className="mt-2 space-y-1 text-cream">
                    <li>Friends: {p.friends.length ? p.friends.join(", ") : "—"}</li>
                    <li>Enemies: {p.enemies.length ? p.enemies.join(", ") : "—"}</li>
                    <li>Neutral: {p.neutral.length ? p.neutral.join(", ") : "—"}</li>
                    {p.dashaYears !== null && <li>Vimshottari Dasha: {p.dashaYears} years</li>}
                  </ul>
                </div>
              </div>

              <details className="mt-5 group">
                <summary className="cursor-pointer text-xs font-semibold tracking-wide text-gold-bright uppercase">
                  {p.name} in each house
                </summary>
                <ol className="mt-3 space-y-2 text-sm">
                  {p.inHouses.map((text, i) => (
                    <li key={i} className="text-muted">
                      <span className="font-semibold text-cream">House {i + 1}:</span> {text}
                    </li>
                  ))}
                </ol>
              </details>
            </article>
          ))}
        </div>
      )}
    </FilterableList>
  );
}
