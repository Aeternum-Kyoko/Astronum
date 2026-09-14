"use client";

import { useMemo, useState } from "react";

/** Simple client-side substring filter for a static reference list — no server round-trip, no new dependency. */
export function useTextFilter<T>(items: T[], getSearchText: (item: T) => string) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
  }, [items, query, getSearchText]);

  return { query, setQuery, filtered };
}
