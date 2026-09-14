"use client";

import { SIGN_REFERENCE } from "@/lib/astrology/reference/signs";
import FilterableList from "./FilterableList";

export default function SignsSection() {
  return (
    <FilterableList
      items={SIGN_REFERENCE}
      placeholder="Search signs — e.g. Scorpio, Fire, Fixed…"
      match={(s, q) =>
        s.name.toLowerCase().includes(q) ||
        s.sanskrit.toLowerCase().includes(q) ||
        s.element.toLowerCase().includes(q) ||
        s.quality.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      }
    >
      {(filtered) => (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((s) => (
            <article key={s.name} id={s.name.toLowerCase()} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl text-cream">
                  {s.name} <span className="text-sm text-muted">({s.sanskrit})</span>
                </h2>
                <span className="text-xs text-gold-bright">{s.rulingPlanet}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {s.element} · {s.quality} · rules {s.bodyPart}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>
                  <span className="text-cream">Harmonious:</span> {s.harmoniousWith.join(", ")}
                </span>
                <span>
                  <span className="text-cream">Challenging:</span> {s.challengingWith.join(", ")}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </FilterableList>
  );
}
