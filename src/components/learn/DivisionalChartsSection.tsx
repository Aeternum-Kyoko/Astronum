"use client";

import { DIVISIONAL_CHART_REFERENCE } from "@/lib/astrology/reference/divisionalCharts";
import FilterableList from "./FilterableList";

export default function DivisionalChartsSection() {
  return (
    <FilterableList
      items={DIVISIONAL_CHART_REFERENCE}
      placeholder="Search vargas — e.g. D9, career, marriage…"
      match={(v, q) =>
        v.key.toLowerCase().includes(q) || v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
      }
    >
      {(filtered) => (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((v) => (
            <article key={v.key} id={v.key.toLowerCase()} className="card-edge scroll-mt-24 rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl text-cream">
                  {v.key} <span className="text-sm text-muted">· {v.title}</span>
                </h2>
                <span className="text-xs text-gold-bright">÷{v.divisions}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.description}</p>
            </article>
          ))}
        </div>
      )}
    </FilterableList>
  );
}
