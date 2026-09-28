"use client";

import { useEffect, useState } from "react";
import type { BirthParams } from "@/lib/birthParams";

export interface SavedProfile extends BirthParams {
  id: string;
  relation: string;
  isDefault: boolean;
}

/** One-tap buttons for the signed-in user's saved profiles; renders nothing when signed out or empty. */
export default function ProfileChips({ onPick, label = "Use a saved profile" }: { onPick: (p: SavedProfile) => void; label?: string }) {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/charts")
      .then((r) => (r.ok ? r.json() : { charts: [] }))
      .then((d) => alive && setProfiles(d.charts ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!profiles.length) return null;
  return (
    <div className="text-center">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <ul className="mt-2 flex flex-wrap justify-center gap-2">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${p.isDefault ? "border-gold bg-gold text-on-gold" : "border-border text-cream hover:border-gold"}`}
            >
              {p.name} <span className={`text-xs font-normal ${p.isDefault ? "" : "text-muted"}`}>· {p.relation}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
