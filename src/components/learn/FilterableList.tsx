"use client";

import { useMemo, useState } from "react";

export default function FilterableList<T>({
  items,
  placeholder,
  match,
  children,
}: {
  items: T[];
  placeholder: string;
  match: (item: T, query: string) => boolean;
  children: (filtered: T[]) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => match(item, q));
  }, [items, query, match]);

  return (
    <div>
      <div className="mx-auto max-w-md">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input"
        />
      </div>
      <div className="mt-10">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted">Nothing matches &ldquo;{query}&rdquo;.</p>
        ) : (
          children(filtered)
        )}
      </div>
    </div>
  );
}
