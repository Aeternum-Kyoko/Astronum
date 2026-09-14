"use client";

import { useCallback } from "react";
import { GLOSSARY } from "@/lib/astrology/reference/glossary";
import { useTextFilter } from "./useTextFilter";
import SearchInput from "./SearchInput";

export default function GlossaryExplorer() {
  const getSearchText = useCallback((g: (typeof GLOSSARY)[number]) => `${g.term} ${g.definition}`, []);
  const { query, setQuery, filtered } = useTextFilter(GLOSSARY, getSearchText);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} placeholder="Search terms (e.g. Lagna, Bhukti, Kendra)…" />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <dl className="card-edge mt-10 divide-y divide-border/50 rounded-2xl">
          {filtered.map((g) => (
            <div key={g.term} id={g.term.split(" ")[0]} className="scroll-mt-24 px-6 py-4">
              <dt className="font-display text-base text-gold-bright">{g.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-cream">{g.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
