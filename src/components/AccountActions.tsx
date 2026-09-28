"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_CHANGED_EVENT } from "@/lib/safeRedirect";
import { RELATIONS } from "@/lib/relations";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.push("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream transition-colors hover:border-gold hover:text-gold-bright"
    >
      Sign out
    </button>
  );
}

/** Two-step delete (no browser confirm dialog): first click arms it, second click deletes. */
export function DeleteChartButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setBusy(true);
    await fetch(`/api/charts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={armed ? `Confirm deleting ${name}` : `Delete ${name}`}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        armed ? "border-rose bg-rose/10 text-rose" : "border-border text-muted hover:border-rose hover:text-rose"
      }`}
    >
      {busy ? "Deleting…" : armed ? "Tap again to delete" : "Delete"}
    </button>
  );
}

/** Relation picker and "make default" for one saved profile. */
export function ProfileControls({ id, relation, isDefault }: { id: string; relation: string; isDefault: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/charts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`rel-${id}`}>
        Relation
      </label>
      <select id={`rel-${id}`} value={relation} disabled={busy} onChange={(e) => patch({ relation: e.target.value })} className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs text-cream">
        {RELATIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {isDefault ? (
        <span className="rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold-bright">Default profile</span>
      ) : (
        <button type="button" disabled={busy} onClick={() => patch({ isDefault: true })} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-gold hover:text-gold-bright">
          Make default
        </button>
      )}
    </div>
  );
}

const ALERTS = [
  { key: "notifyDaily", label: "Daily horoscope from my default profile", note: "Each morning: stars, Tarabala, running dasha and what to watch." },
  { key: "notifyDasha", label: "Dasha changes", note: "A week before a new Antardasha begins for any profile." },
  { key: "notifyTransits", label: "Sade Sati and major transits", note: "When Sade Sati or Dhaiya is about to begin for any profile." },
  { key: "notifyFestivals", label: "Festivals and vrats", note: "The day before major festivals, Ekadashi and Purnima." },
] as const;

export type AlertPrefs = Record<(typeof ALERTS)[number]["key"], boolean>;

/** Email alert toggles, saved as they change. */
export function AlertSettings({ initial }: { initial: AlertPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  async function toggle(key: keyof AlertPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const res = await fetch("/api/account/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    setStatus(res.ok ? "Saved" : "Couldn't save — try again");
  }
  return (
    <div>
      <ul className="space-y-3">
        {ALERTS.map((a) => (
          <li key={a.key}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={prefs[a.key]} onChange={() => toggle(a.key)} className="mt-1 h-4 w-4 accent-[var(--color-gold)]" />
              <span>
                <span className="block text-sm font-semibold text-cream">{a.label}</span>
                <span className="block text-xs text-muted">{a.note}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p role="status" className="mt-2 text-xs text-muted">
        {status}
      </p>
    </div>
  );
}
