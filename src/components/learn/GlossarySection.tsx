"use client";

import { GLOSSARY } from "@/lib/astrology/reference/glossary";
import FilterableList from "./FilterableList";

export default function GlossarySection() {
  return (
    <FilterableList
      items={GLOSSARY}
      placeholder="Search terms — e.g. Lagna, Dasha, Kendra…"
      match={(g, q) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q)}
    >
      {(filtered) => (
        <dl className="mx-auto max-w-3xl space-y-5">
          {filtered.map((g) => (
            <div key={g.term} id={g.term.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="scroll-mt-24 border-b border-border/40 pb-5 last:border-0">
              <dt className="font-display text-lg text-gold-bright">{g.term}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">{g.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </FilterableList>
  );
}
