"use client";

import { useMemo, useState } from "react";
import KundliChart, { type ChartPick, type ChartStyle } from "@/components/KundliChart";
import ShareBar from "@/components/ShareBar";
import { natalMarkers } from "@/lib/astrology/chartMarkers";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { analyzeYogas } from "@/lib/astrology/yogaAnalysis";
import { lalKitab } from "@/lib/astrology/lalKitab";
import { drawChartCard, canvasToBlob } from "@/lib/chartImage";
import { toBirthQuery } from "@/lib/birthParams";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";

const monthYear = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { month: "short", year: "numeric" });
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const TONE_TEXT = { Supportive: "text-gold-bright", Mixed: "text-cream", Demanding: "text-rose" } as const;
const LEVEL = ["Mahadasha", "Antardasha", "Pratyantardasha"];
/** The chart-specific half of a Mahadasha overview ("…so results rise and fall — it sits in the 1st…"), sentence-cased. */
const inChart = (overview: string) => {
  const s = overview.split(". ").slice(2).join(". ");
  const tail = s.includes(", so ") ? s.slice(s.indexOf(", so ") + 5) : s;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
};
const linkClass = "text-sm font-semibold text-cream underline decoration-gold/60 underline-offset-4 transition-colors hover:decoration-gold";

/**
 * The kundli's opening view. One hero — the chart, explorable by tapping —
 * with "right now" beside it, the whole life as a strip beneath, then quiet
 * lists that lead into each section.
 */
export default function KundliSummary({ chart, report, go, style, setStyle }: { chart: KundaliChart; report: KundaliReport | null; go: (slug: string) => void; style: ChartStyle; setStyle: (s: ChartStyle) => void }) {
  const [pick, setPick] = useState<ChartPick | null>(null);
  const marks = useMemo(() => natalMarkers(chart), [chart]);
  const points = chart.planets.map((p) => ({ ...p, markers: marks[p.planet] }));
  const now = report ? new Date(report.generatedAt) : new Date();
  const running = useMemo(() => periodsAt(chart.dashas, now, 3), [chart.dashas]); // eslint-disable-line react-hooks/exhaustive-deps
  const yogas = useMemo(() => analyzeYogas(chart), [chart]);
  const lk = useMemo(() => lalKitab(chart), [chart]);
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const md = report?.dashaDetail?.find((m) => new Date(m.start) <= now && now < new Date(m.end));
  const upcoming = report?.timeline?.keyWindows.filter((k) => new Date(k.end) > now).slice(0, 3) ?? [];
  const houses = report?.houses ? [...report.houses].sort((a, b) => b.strength.score - a.strength.score) : [];
  const nextChange = running.length ? running.reduce((a, b) => (b.end < a.end ? b : a)) : null;
  const url = typeof window !== "undefined" ? `${window.location.origin}/kundali?${toBirthQuery(chart.input)}` : "";
  const weak = lk.planets.filter((p) => p.verdict === "Weak").length;
  const strong = yogas.findings.filter((f) => f.strength === "Strong" && f.category !== "arishta").slice(0, 3);

  const makeImage = () =>
    canvasToBlob(
      drawChartCard({
        style,
        ascendantSignIndex: chart.ascendant.signIndex,
        planets: points,
        title: `${chart.input.name || "My"}'s birth chart`,
        subtitle: `${chart.ascendant.sign} Lagna · Moon in ${moon.sign} (${moon.nakshatra})${running[0] ? ` · ${running.map((p) => p.lord).join("–")} dasha` : ""}`,
        footer: "Free kundli with every calculation explained · astronum",
      })
    );

  return (
    <div className="space-y-16">
      {/* Hero: the chart, and what's happening now */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-label="Birth chart">
          <KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={points} style={style} onStyleChange={setStyle} toggleId="summary-style" onPick={setPick} selected={pick} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Tap a planet or a house to read it.</p>
            <ShareBar url={url} title={`${chart.input.name || "My"} birth chart`} fileName="birth-chart.png" makeImage={makeImage} />
          </div>
          <PickDetail chart={chart} report={report} pick={pick} marks={marks} onClose={() => setPick(null)} />
        </section>

        <section aria-labelledby="now-title" className="lg:pt-1">
          <h2 id="now-title" className="text-sm font-semibold text-muted">
            Running now
          </h2>
          <p className="mt-2 text-3xl leading-tight font-bold text-cream lg:text-[2.125rem]">
            {running.length
              ? running.map((p, i) => (
                  <span key={i} className="whitespace-nowrap">
                    {i > 0 && <span className="px-1.5 font-normal text-muted">›</span>}
                    {p.lord}
                  </span>
                ))
              : "—"}
          </p>
          <p className="mt-1.5 text-sm text-muted">{running.map((_, i) => LEVEL[i]).join(" › ")}</p>
          {md && (
            <p className="reading mt-6">
              <span className={`font-semibold ${TONE_TEXT[md.tone]}`}>A {md.tone.toLowerCase()} period. </span>
              {inChart(md.overview)}
            </p>
          )}
          <dl className="mt-7 divide-y divide-border/50 border-y border-border/50 text-[0.95rem]">
            {nextChange && <Row label="Next change" value={`${monthYear(nextChange.end)}, when ${nextChange.lord}'s ${LEVEL[nextChange.chain.length - 1]} ends`} />}
            <Row label="Sade Sati" value={chart.sadeSati.active ? `Running, ${chart.sadeSati.phase ?? ""} phase` : "Not running"} tone={chart.sadeSati.active ? "text-rose" : undefined} />
          </dl>

          <h3 className="mt-10 text-sm font-semibold text-muted">Coming up</h3>
          {report?.timeline ? (
            upcoming.length ? (
              <ol className="mt-4 space-y-5">
                {upcoming.map((k) => (
                  <li key={k.kind} className="grid grid-cols-[4.25rem_1fr] gap-4">
                    <span className="font-tabular pt-0.5 text-sm text-muted">Age {k.ages.split("–")[0]}</span>
                    <span>
                      <span className={`block font-semibold ${k.nature === "caution" ? "text-rose" : "text-cream"}`}>{k.label}</span>
                      <span className="text-sm text-muted">
                        {monthYear(k.start)} to {monthYear(k.end)}, {k.confidence}% confidence
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">No major windows ahead in the timeline.</p>
            )
          ) : (
            <div className="mt-4 space-y-4" aria-busy="true">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          )}
          <button type="button" onClick={() => go("timeline")} className={`mt-7 ${linkClass}`}>
            See your whole life timeline
          </button>
        </section>
      </div>

      {/* The whole life as one strip */}
      {report?.dashaDetail ? <LifeStrip report={report} now={now} onOpen={() => go("dashas")} /> : <div className="skeleton h-24 rounded-2xl" aria-busy="true" />}

      {/* Chart at a glance */}
      <section aria-labelledby="glance-title" className="section-rule pt-12">
        <h2 id="glance-title" className="text-2xl font-bold text-cream md:text-3xl">
          Your chart at a glance
        </h2>
        <div className="mt-7 grid gap-x-16 gap-y-10 md:grid-cols-2">
          <dl className="divide-y divide-border/50 border-y border-border/50 text-[0.95rem]">
            <Row label="Lagna" value={`${chart.ascendant.sign} ${chart.ascendant.degreeInSign.toFixed(1)}°`} />
            <Row label="Moon sign, nakshatra" value={`${moon.sign}, ${moon.nakshatra} ${moon.pada}`} />
            <Row label="Sun sign (sidereal)" value={sun.sign} />
            <Row label="Yogakaraka" value={yogas.yogakaraka ?? "None for this Lagna"} />
            <Row
              label="Yogas"
              value={`${yogas.findings.filter((f) => f.category === "raja" && f.strength !== "Weak").length} Raj, ${yogas.findings.filter((f) => f.category === "dhana" && f.strength !== "Weak").length} Dhan, ${yogas.findings.filter((f) => f.category === "arishta").length} Arisht`}
            />
          </dl>
          <div>
            {strong.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-muted">Strongest combinations</h3>
                <ul className="mt-3 space-y-2 text-lg text-cream">
                  {strong.map((f) => (
                    <li key={f.id}>{f.name}</li>
                  ))}
                </ul>
              </>
            )}
            {houses.length > 0 && (
              <p className="reading mt-6 text-[1rem]">
                Your strongest houses are the {houses.slice(0, 2).map((h) => `${ord(h.house)} (${h.themes.split(",")[0].toLowerCase()})`).join(" and ")}. The {houses.slice(-2).map((h) => `${ord(h.house)} (${h.themes.split(",")[0].toLowerCase()})`).join(" and ")} need the most care.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              <button type="button" onClick={() => go("yogas")} className={linkClass}>
                Every yoga, explained
              </button>
              <button type="button" onClick={() => go("houses")} className={linkClass}>
                All twelve houses
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Life sectors as rings */}
      <section aria-labelledby="sectors-title" className="section-rule pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="sectors-title" className="text-2xl font-bold text-cream md:text-3xl">
            Areas of life
          </h2>
          <button type="button" onClick={() => go("sectors")} className={linkClass}>
            Read each area in full
          </button>
        </div>
        {report?.sectors ? (
          <ul className="mt-8 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-5 lg:grid-cols-9">
            {report.sectors.map((s) => (
              <li key={s.key}>
                <button type="button" onClick={() => go("sectors")} className="group flex w-full flex-col items-center gap-2.5 rounded-xl py-1 text-center" aria-label={`${s.title}: ${s.score} out of 100`}>
                  <Ring value={s.score} />
                  <span className="text-sm leading-snug text-cream group-hover:underline">{s.title.split(" & ")[0].split(",")[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-5 lg:grid-cols-9" aria-busy="true">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="skeleton mx-auto h-16 w-16 rounded-full" />
            ))}
          </div>
        )}
      </section>

      {/* Leads into the deeper sections */}
      <section aria-label="More about your chart" className="section-rule">
        <ul className="divide-y divide-border/50">
          <LinkRow
            title="Career"
            detail={report?.career ? `${report.career.fields.map((f) => f.fields[0]).join(", ")}. Suits ${report.career.mode.verdict === "Either" ? "a job or a business" : report.career.mode.verdict.toLowerCase()}.` : "Fields, timing, and whether a job or business suits you"}
            onClick={() => go("career")}
          />
          <LinkRow
            title="Lal Kitab"
            detail={`${lk.rins.length ? `${lk.rins.length} karmic debt${lk.rins.length > 1 ? "s" : ""}` : "No karmic debts"}, and ${weak === 1 ? "1 planet needs" : `${weak} planets need`} simple remedies`}
            onClick={() => go("lalkitab")}
          />
          <LinkRow title="Remedies" detail="Gemstones, mantras and practices chosen for your chart" onClick={() => go("remedies")} />
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`text-right font-medium ${tone ?? "text-cream"}`}>{value}</dd>
    </div>
  );
}

function LinkRow({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="group flex w-full items-center justify-between gap-6 py-5 text-left">
        <span>
          <span className="block text-lg font-semibold text-cream">{title}</span>
          <span className="mt-0.5 block text-sm text-muted">{detail}</span>
        </span>
        <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cream">
          <path d="M1.5 1.5 7 7l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  );
}

/** A score as a ring: gold when the area is supported, rose when it needs effort. */
export function Ring({ value, size = 64 }: { value: number; size?: number }) {
  const r = 27;
  const c = 2 * Math.PI * r;
  const good = value >= 55;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="3.5" opacity="0.55" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={good ? "var(--color-gold)" : "var(--color-rose)"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className="font-tabular text-base font-semibold text-cream">{value}</span>
    </span>
  );
}

const STRIP_SPAN = 100;
const TONE_BG = { Supportive: "bg-gold/65", Mixed: "bg-cream/20", Demanding: "bg-rose/55" } as const;

/** Every Mahadasha across a lifetime, sized by its years, with today marked and the key windows as dots. */
function LifeStrip({ report, now, onOpen }: { report: KundaliReport; now: Date; onOpen: () => void }) {
  const mahas = report.dashaDetail!.filter((m) => m.ageStart < STRIP_SPAN);
  const pct = (age: number) => `${Math.min(100, Math.max(0, (age / STRIP_SPAN) * 100))}%`;
  const first = mahas[0];
  const birth = new Date(first.start).getTime() - first.ageStart * 365.25 * 86400000;
  const ageNow = (now.getTime() - birth) / (365.25 * 86400000);
  const windows = report.timeline?.keyWindows ?? [];
  return (
    <section aria-labelledby="strip-title" className="section-rule pt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="strip-title" className="text-2xl font-bold text-cream md:text-3xl">
          Your life in dashas
        </h2>
        <button type="button" onClick={onOpen} className={linkClass}>
          Every period, read in full
        </button>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">Each band is a Mahadasha, as long as the years it lasts. Dots above mark the strongest event windows.</p>

      <div className="relative mt-10 pb-6">
        {windows.map((w) => (
          <span
            key={w.kind}
            title={`${w.label}, age ${w.ages}`}
            className={`absolute -top-4 h-2 w-2 -translate-x-1/2 rounded-full ${w.nature === "caution" ? "bg-rose" : "bg-gold-bright"}`}
            style={{ left: pct(Number(w.ages.split("–")[0])) }}
          />
        ))}
        <div className="flex h-11 overflow-hidden rounded-xl ring-1 ring-border/60">
          {mahas.map((m) => (
            <button
              type="button"
              onClick={onOpen}
              key={m.lord + m.ageStart}
              className={`flex min-w-0 items-center justify-center border-r border-ink/70 last:border-0 hover:brightness-125 ${TONE_BG[m.tone]}`}
              style={{ width: `${((Math.min(m.ageEnd, STRIP_SPAN) - m.ageStart) / STRIP_SPAN) * 100}%` }}
              title={`${m.lord} Mahadasha, age ${Math.floor(m.ageStart)} to ${Math.floor(m.ageEnd)}: ${m.tone.toLowerCase()}`}
              aria-label={`${m.lord} Mahadasha, age ${Math.floor(m.ageStart)} to ${Math.floor(m.ageEnd)}, ${m.tone.toLowerCase()}`}
            >
              {Math.min(m.ageEnd, STRIP_SPAN) - m.ageStart >= 4 && (
                <span className="overflow-hidden px-0.5 text-xs font-semibold whitespace-nowrap text-cream">
                  <span className="hidden sm:inline">{Math.min(m.ageEnd, STRIP_SPAN) - m.ageStart >= 7 ? m.lord : m.lord.slice(0, 2)}</span>
                  <span className="sm:hidden">{Math.min(m.ageEnd, STRIP_SPAN) - m.ageStart >= 19 ? m.lord : m.lord.slice(0, 2)}</span>
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute top-0 h-11 w-0.5 -translate-x-1/2 rounded-full bg-cream shadow-[0_0_0_3px_var(--color-ink)]" style={{ left: pct(ageNow) }} aria-hidden="true" />
        <span className="font-tabular absolute top-[3.2rem] -translate-x-1/2 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-ink" style={{ left: pct(Math.min(93, Math.max(7, ageNow))) }}>
          You, {Math.floor(ageNow)}
        </span>
      </div>
      <div className="font-tabular mt-3 flex justify-between text-xs text-muted" aria-hidden="true">
        {[0, 20, 40, 60, 80, 100].map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <Key className="h-2.5 w-4 rounded-sm bg-gold/65">Supportive</Key>
        <Key className="h-2.5 w-4 rounded-sm bg-cream/20">Mixed</Key>
        <Key className="h-2.5 w-4 rounded-sm bg-rose/55">Demanding</Key>
        <Key className="h-2 w-2 rounded-full bg-gold-bright">Event window</Key>
      </p>
    </section>
  );
}

function Key({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block ${className}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function PickDetail({ chart, report, pick, marks, onClose }: { chart: KundaliChart; report: KundaliReport | null; pick: ChartPick | null; marks: Record<string, string>; onClose: () => void }) {
  if (!pick) return null;
  const planet = pick.kind === "planet" ? chart.planets.find((p) => p.planet === pick.planet) : null;
  const reading = planet ? report?.planets.find((r) => r.planet === planet.planet) : null;
  const house = pick.kind === "house" ? report?.houses?.[pick.house - 1] : null;
  return (
    <div className="card-edge mt-6 rounded-2xl p-6 md:p-7" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-cream">
          {planet ? (
            <>
              {planet.planet} <span className="text-base font-normal text-muted">in {planet.sign}, {ord(planet.house)} house</span>
            </>
          ) : (
            <>
              {ord(pick.kind === "house" ? pick.house : 1)} house {house && <span className="text-base font-normal text-muted">({house.sanskrit})</span>}
            </>
          )}
        </h3>
        <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 rounded-full p-2.5 text-muted hover:text-cream">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="m2 2 8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {planet && (
        <div className="mt-3 space-y-3">
          <p className="font-tabular text-sm text-muted">
            {[`${planet.degreeInSign.toFixed(2)}°`, `${planet.nakshatra} pada ${planet.pada}`, planet.dignity, marks[planet.planet], planet.retrograde ? "retrograde" : null].filter(Boolean).join(", ")}
          </p>
          {reading ? (
            <>
              <p className="reading-lead">{reading.house}</p>
              <p className="reading">{reading.sign}</p>
              {reading.lordship && <p className="reading">{reading.lordship}</p>}
              <p className="reading">{reading.nakshatra}</p>
              {reading.strength && <p className="text-sm text-muted">{reading.strength}</p>}
              {reading.flags.map((f) => (
                <p key={f} className="text-sm text-rose">
                  {f}
                </p>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted">Loading the reading…</p>
          )}
        </div>
      )}
      {pick.kind === "house" &&
        (house ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">
              {house.themes}. {house.sign}, {house.strength.verdict.toLowerCase()} at {house.strength.score}/100.
            </p>
            <p className="reading-lead">{house.summary}</p>
            <p className="reading">{house.lordText}</p>
            {house.occupants.map((o) => (
              <p key={o.planet} className="reading">
                <span className="font-semibold text-cream">{o.planet}.</span> {o.text}
              </p>
            ))}
            <p className="reading">{house.aspectText}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Loading the house reading…</p>
        ))}
    </div>
  );
}
