"use client";

import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface PlaceSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** City search with geocoded suggestions; only a picked suggestion counts as a selected place. */
export default function PlaceInput({
  selected,
  onSelect,
  showTimezone = true,
  placeholder,
}: {
  selected: PlaceSuggestion | null;
  onSelect: (place: PlaceSuggestion | null) => void;
  showTimezone?: boolean;
  placeholder?: string;
}) {
  const t = useT();
  const [query, setQuery] = useState(selected?.displayName ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the text in sync when the parent sets a place (e.g. from a shared link).
  const [lastSelected, setLastSelected] = useState(selected);
  if (selected !== lastSelected) {
    setLastSelected(selected);
    if (selected) setQuery(selected.displayName);
  }

  useEffect(() => {
    if (selected && query === selected.displayName) return;
    if (query.trim().length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  return (
    <div className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
          <PinIcon />
        </span>
        <input
          required
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect(null);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder ?? t("Start typing a city, e.g. Jaipur, India")}
          className="input input-icon"
          autoComplete="off"
        />
      </div>
      <AnimatePresence>
        {showSuggestions && query.trim().length >= 3 && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card-glass shadow-floating absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl"
          >
            {suggestions.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <button
                  type="button"
                  onMouseDown={() => {
                    onSelect(s);
                    setQuery(s.displayName);
                    setSuggestions([]);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-cream"
                >
                  {s.displayName}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {showTimezone && selected && (
        <p className="mt-2 text-xs text-muted">
          {t("Timezone detected:")} <span className="text-gold-bright">{selected.timezone}</span>
        </p>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 14.5S13 10 13 6.5a5 5 0 1 0-10 0C3 10 8 14.5 8 14.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
