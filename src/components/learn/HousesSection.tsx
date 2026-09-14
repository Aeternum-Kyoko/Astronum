"use client";

import { HOUSE_REFERENCE } from "@/lib/astrology/reference/houses";
import FilterableList from "./FilterableList";

export default function HousesSection() {
  return (
    <FilterableList
      items={HOUSE_REFERENCE}
      placeholder="Search houses — e.g. career, marriage, Kendra…"
      match={(h, q) =>
        String(h.house).includes(q) ||
        h.sanskritName.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.classification.some((c) => c.toLowerCase().includes(q))
      }
    >
      {(filtered) => (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((h) => (
            <article key={h.house} id={`house-${h.house}`} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl text-cream">
                  House {h.house} <span className="text-sm text-muted">({h.sanskritName})</span>
                </h2>
              </div>
              <p className="mt-1 text-xs text-gold-bright">
                {h.classification.join(" · ")} · Karaka: {h.karaka.join(", ")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{h.description}</p>
            </article>
          ))}
        </div>
      )}
    </FilterableList>
  );
}
