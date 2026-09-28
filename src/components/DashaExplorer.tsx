"use client";

import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { PlanetName } from "@/lib/astrology/constants";
import { HOUSE_SIGNIFICATION, PLANET_KEYNOTE } from "@/lib/astrology/content";
import { FRIENDS, ENEMIES } from "@/lib/astrology/dignity";
import { childPeriods, formatSpan, LEVEL_NAMES, MAX_DEPTH, periodsAt, type TreePeriod } from "@/lib/astrology/dashaTree";

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

const LEVEL_NOTE = [
  "The major periods of life, each lasting years. The Mahadasha lord sets the overall theme.",
  "Sub-periods lasting months to a few years. The Antardasha lord says which part of the Mahadasha's theme is active.",
  "Periods of weeks to months that fine-tune timing within the Antardasha.",
  "Periods of days that astrologers use to pin events to a week.",
  "The finest level — hours to a day or two — used to time events to the day and hour.",
];

function relation(a: PlanetName, b: PlanetName): string {
  if (a === b) return "the same planet, so its themes are doubled";
  if (FRIENDS[a]?.includes(b)) return `${a} regards ${b} as a friend, so they work together smoothly`;
  if (ENEMIES[a]?.includes(b)) return `${a} regards ${b} as an enemy, so their agendas can pull against each other`;
  return `${a} is neutral towards ${b}`;
}

export default function DashaExplorer({ chart }: { chart: KundaliChart }) {
  const roots: TreePeriod[] = useMemo(
    () => chart.dashas.map((d) => ({ lord: d.lord, start: new Date(d.start), end: new Date(d.end), chain: [d.lord] })),
    [chart.dashas]
  );
  const [path, setPath] = useState<TreePeriod[]>([]);
  const now = new Date();
  const running = useMemo(() => periodsAt(chart.dashas, now), [chart.dashas]); // eslint-disable-line react-hooks/exhaustive-deps

  const depth = path.length; // 0 = choosing a Mahadasha
  const list = depth === 0 ? roots : childPeriods(path[depth - 1]);
  const withTime = depth >= 3;
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, withTime ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short", year: "numeric" });

  const place = (lord: PlanetName) => chart.planets.find((p) => p.planet === lord)!;
  const rules = (lord: PlanetName) => chart.houseLords.filter((h) => h.lord === lord).map((h) => h.house);
  const isRunning = (p: TreePeriod) => running[p.chain.length - 1]?.chain.join() === p.chain.join();

  function reason(p: TreePeriod): string {
    const lord = p.lord as PlanetName;
    const pl = place(lord);
    const ruled = rules(lord);
    const parts = [
      `${lord} (${PLANET_KEYNOTE[lord].split(",").slice(0, 2).join(" and")}) sits in your ${ordinal(pl.house)} house of ${HOUSE_SIGNIFICATION[pl.house].split(",").slice(0, 2).join(" and")}, in ${pl.sign}${pl.dignity ? ` (${pl.dignity.toLowerCase()})` : ""}.`,
      ruled.length
        ? `It rules your ${ruled.map(ordinal).join(" and ")} house${ruled.length > 1 ? "s" : ""}, so ${ruled.map((h) => HOUSE_SIGNIFICATION[h].split(",")[0]).join(" and ")} ${ruled.length > 1 ? "are" : "is"} also in play.`
        : `As a shadow planet it works through ${pl.sign}'s lord.`,
    ];
    if (p.chain.length > 1) parts.push(`Within ${p.chain[p.chain.length - 2]}'s period: ${relation(p.chain[p.chain.length - 2] as PlanetName, lord)}.`);
    return parts.join(" ");
  }

  return (
    <section className="card-edge rounded-2xl p-6 md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-cream">Vimshottari explorer</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">Drill from the Mahadasha down to the Prana dasha — the finest level, timed to the minute.</p>
        </div>
        <button type="button" onClick={() => setPath(running.slice(0, MAX_DEPTH - 1))} className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-on-gold hover:bg-gold-bright">
          Go to now
        </button>
      </div>

      <nav aria-label="Dasha levels" className="mt-5 flex flex-wrap items-center gap-1.5 text-sm">
        <button type="button" onClick={() => setPath([])} className={`rounded-full px-3 py-1 ${depth === 0 ? "bg-surface-raised text-cream" : "text-gold-bright hover:underline"}`}>
          All Mahadashas
        </button>
        {path.map((p, i) => (
          <span key={p.chain.join()} className="flex items-center gap-1.5">
            <span className="text-muted" aria-hidden="true">
              ›
            </span>
            <button
              type="button"
              onClick={() => setPath(path.slice(0, i + 1))}
              className={`rounded-full px-3 py-1 ${i === depth - 1 ? "bg-surface-raised text-cream" : "text-gold-bright hover:underline"}`}
            >
              {p.lord} <span className="text-xs text-muted">{LEVEL_NAMES[i].replace(" dasha", "")}</span>
            </button>
          </span>
        ))}
      </nav>

      <p className="mt-4 text-sm font-semibold text-cream">{LEVEL_NAMES[depth]}s</p>
      <p className="text-xs text-muted">{LEVEL_NOTE[depth]}</p>

      <ol className="mt-3 divide-y divide-border">
        {list.map((p) => {
          const live = isRunning(p);
          const canDrill = p.chain.length < MAX_DEPTH;
          return (
            <li key={p.chain.join() + p.start.getTime()} className={`py-3 ${live ? "-mx-3 rounded-xl bg-gold/10 px-3" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-cream">
                  {p.chain.join(" › ")}
                  {live && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-on-gold">Now</span>}
                </p>
                <p className="font-tabular text-sm text-muted">
                  {fmt(p.start)} – {fmt(p.end)} <span className="text-xs">({formatSpan(p.end.getTime() - p.start.getTime())})</span>
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{reason(p)}</p>
              {canDrill && (
                <button type="button" onClick={() => setPath([...path, p])} className="mt-1.5 text-xs font-semibold text-gold-bright hover:underline">
                  Open {LEVEL_NAMES[p.chain.length]}s
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-muted">Times are shown in your device&rsquo;s time zone. Deeper levels are only as exact as the birth time — a minute&rsquo;s error shifts Prana periods noticeably.</p>
    </section>
  );
}
