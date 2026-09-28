"use client";

import { useEffect, useState } from "react";

export interface RunningSlot {
  system: string;
  name: string;
  start: string;
  end: string;
  tone: "good" | "bad" | "neutral";
}

const TONE = { good: "text-gold-bright", bad: "text-rose", neutral: "text-cream" } as const;

function left(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

/**
 * The muhurta running now in each system, with a live countdown to when it ends.
 * `endsIn` is a template with "{t}" where the time left goes, since functions can't cross from the server.
 */
export default function RunningNow({ slots, title, endsIn }: { slots: RunningSlot[]; title: string; endsIn: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  const running = [...new Set(slots.map((s) => s.system))]
    .map((system) => slots.find((s) => s.system === system && new Date(s.start).getTime() <= now && now < new Date(s.end).getTime()))
    .filter((s): s is RunningSlot => !!s);
  if (!running.length) return null;
  return (
    <section className="card-edge rounded-2xl p-5" aria-live="polite">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {running.map((s) => (
          <li key={s.system} className="rounded-xl border border-border/70 px-4 py-3">
            <span className="block text-xs text-muted">{s.system}</span>
            <span className={`text-lg font-bold ${TONE[s.tone]}`}>{s.name}</span>
            <span className="font-tabular block text-xs text-muted">{endsIn.replace("{t}", left(new Date(s.end).getTime() - now))}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
