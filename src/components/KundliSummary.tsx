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

/** The kundli's opening view: the chart to explore, and one card per area that links to its full tab. */
export default function KundliSummary({ chart, report, go, style, setStyle }: { chart: KundaliChart; report: KundaliReport | null; go: (slug: string) => void; style: ChartStyle; setStyle: (s: ChartStyle) => void }) {
  const [pick, setPick] = useState<ChartPick | null>({ kind: "house", house: 1 });
  const marks = useMemo(() => natalMarkers(chart), [chart]);
  const points = chart.planets.map((p) => ({ ...p, markers: marks[p.planet] }));
  const now = report ? new Date(report.generatedAt) : new Date();
  const running = useMemo(() => periodsAt(chart.dashas, now, 3), [chart.dashas]); // eslint-disable-line react-hooks/exhaustive-deps
  const yogas = useMemo(() => analyzeYogas(chart), [chart]);
  const lk = useMemo(() => lalKitab(chart), [chart]);
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const md = report?.dashaDetail?.find((m) => new Date(m.start) <= now && now < new Date(m.end));
  const upcoming = report?.timeline?.keyWindows.filter((k) => new Date(k.end) > now).slice(0, 4) ?? [];
  const houses = report?.houses ? [...report.houses].sort((a, b) => b.strength.score - a.strength.score) : [];
  const url = typeof window !== "undefined" ? `${window.location.origin}/kundali?${toBirthQuery(chart.input)}` : "";

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
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card-edge rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-cream">Your birth chart</h3>
            <ShareBar url={url} title={`${chart.input.name || "My"} birth chart`} fileName="birth-chart.png" makeImage={makeImage} />
          </div>
          <p className="mt-1 mb-4 text-xs text-muted">Tap a planet or a house to see what it means for you.</p>
          <KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={points} style={style} onStyleChange={setStyle} toggleId="summary-style" onPick={setPick} selected={pick} />
        </section>
        <DetailPanel chart={chart} report={report} pick={pick} setPick={setPick} marks={marks} />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Lagna (ascendant)" value={`${chart.ascendant.sign} ${chart.ascendant.degreeInSign.toFixed(1)}°`} />
        <Fact label="Moon sign · nakshatra" value={`${moon.sign} · ${moon.nakshatra} ${moon.pada}`} />
        <Fact label="Sun sign (sidereal)" value={sun.sign} />
        <Fact label="Yogakaraka" value={yogas.yogakaraka ?? "None for this Lagna"} />
      </dl>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Running now" action="Open dashas" onAction={() => go("dashas")}>
          <p className="text-xl font-bold text-cream">{running.map((p) => p.lord).join(" › ") || "—"}</p>
          {running[0] && (
            <p className="text-xs text-muted">
              {running[0].lord} Mahadasha until {monthYear(running[0].end)}
              {running[1] && `, ${running[1].lord} Antardasha until ${monthYear(running[1].end)}`}
            </p>
          )}
          {md && <p className={`mt-2 text-sm font-semibold ${md.tone === "Supportive" ? "text-gold-bright" : md.tone === "Demanding" ? "text-rose" : "text-cream"}`}>{md.tone} period</p>}
          <p className="mt-1 text-sm text-muted">{chart.sadeSati.active ? `Sade Sati is running (${chart.sadeSati.phase?.toLowerCase() ?? ""} phase).` : "Not in Sade Sati."}</p>
        </Card>

        <Card title="Coming up" action="Open life timeline" onAction={() => go("timeline")}>
          {upcoming.length ? (
            <ul className="space-y-2 text-sm">
              {upcoming.map((k) => (
                <li key={k.kind}>
                  <span className={`font-semibold ${k.nature === "caution" ? "text-rose" : "text-gold-bright"}`}>{k.label}</span>
                  <span className="block text-xs text-muted">
                    Age {k.ages} · {monthYear(k.start)} – {monthYear(k.end)} · {k.confidence}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Loading your timeline…</p>
          )}
        </Card>

        <Card title="Yogas" action="Open yogas" onAction={() => go("yogas")}>
          <ul className="space-y-1.5 text-sm">
            {yogas.findings
              .filter((f) => f.strength === "Strong" && f.category !== "arishta")
              .slice(0, 3)
              .map((f) => (
                <li key={f.id} className="text-cream">
                  {f.name}
                </li>
              ))}
            <li className="text-xs text-muted">
              {yogas.findings.filter((f) => f.category === "raja" && f.strength !== "Weak").length} Raj · {yogas.findings.filter((f) => f.category === "dhana" && f.strength !== "Weak").length} Dhan ·{" "}
              {yogas.findings.filter((f) => f.category === "arishta").length} Arisht
            </li>
          </ul>
        </Card>

        <Card title="Strongest and weakest houses" action="Open houses" onAction={() => go("houses")}>
          {houses.length ? (
            <ul className="space-y-1 text-sm">
              {houses.slice(0, 2).map((h) => (
                <li key={h.house}>
                  <span className="font-semibold text-gold-bright">{ord(h.house)}</span> <span className="text-muted">· {h.themes.split(",")[0]} · {h.strength.score}</span>
                </li>
              ))}
              {houses.slice(-2).map((h) => (
                <li key={h.house}>
                  <span className="font-semibold text-rose">{ord(h.house)}</span> <span className="text-muted">· {h.themes.split(",")[0]} · {h.strength.score}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
        </Card>

        <Card title="Life sectors" action="Open life sectors" onAction={() => go("sectors")}>
          <ul className="space-y-1.5">
            {(report?.sectors ?? []).slice(0, 6).map((s) => (
              <li key={s.key} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-xs">
                <span className="text-cream">{s.title.split(" & ")[0].split(",")[0]}</span>
                <span className="h-1.5 rounded-full bg-border" aria-hidden="true">
                  <span className={`block h-1.5 rounded-full ${s.score >= 55 ? "bg-gold" : "bg-rose"}`} style={{ width: `${s.score}%` }} />
                </span>
                <span className="font-tabular text-right text-muted">{s.score}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Career" action="Open career" onAction={() => go("career")}>
          {report?.career ? (
            <>
              <p className="text-sm text-cream">{report.career.fields.map((f) => f.fields[0]).join(", ")}</p>
              <p className="mt-1 text-xs text-muted">
                10th lord {report.career.tenth.lord} · Amatyakaraka {report.career.amatyakaraka} · suits {report.career.mode.verdict === "Either" ? "job or business" : report.career.mode.verdict.toLowerCase()}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
        </Card>
      </div>

      <Card title="Lal Kitab" action="Open Lal Kitab" onAction={() => go("lalkitab")}>
        <p className="text-sm text-muted">
          {lk.rins.length ? `${lk.rins.length} karmic debt${lk.rins.length > 1 ? "s" : ""} (rin): ${lk.rins.map((r) => r.name.split(" (")[0]).join(", ")}.` : "No karmic debt (rin) is shown in this chart."}{" "}
          {lk.planets.filter((p) => p.verdict === "Weak").length === 1 ? "1 planet needs" : `${lk.planets.filter((p) => p.verdict === "Weak").length} planets need`} Lal Kitab remedies.
        </p>
      </Card>
    </div>
  );
}

function DetailPanel({ chart, report, pick, setPick, marks }: { chart: KundaliChart; report: KundaliReport | null; pick: ChartPick | null; setPick: (p: ChartPick) => void; marks: Record<string, string> }) {
  const planet = pick?.kind === "planet" ? chart.planets.find((p) => p.planet === pick.planet) : null;
  const reading = planet ? report?.planets.find((r) => r.planet === planet.planet) : null;
  const house = pick?.kind === "house" ? report?.houses?.[pick.house - 1] : null;
  return (
    <section className="card-edge rounded-2xl p-6" aria-live="polite">
      <nav aria-label="Choose a house" className="flex flex-wrap gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPick({ kind: "house", house: i + 1 })}
            aria-pressed={pick?.kind === "house" && pick.house === i + 1}
            className={`h-8 w-8 rounded-lg border text-xs font-semibold ${pick?.kind === "house" && pick.house === i + 1 ? "border-gold bg-gold text-on-gold" : "border-border text-muted hover:border-gold"}`}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      {planet && (
        <div className="mt-4 space-y-2 text-sm leading-relaxed">
          <h3 className="text-xl font-bold text-gold-bright">
            {planet.planet} <span className="text-base font-normal text-muted">in {planet.sign}, {ord(planet.house)} house</span>
          </h3>
          <p className="font-tabular text-xs text-muted">
            {planet.degreeInSign.toFixed(2)}° · {planet.nakshatra} pada {planet.pada} {planet.dignity ? `· ${planet.dignity}` : ""} {marks[planet.planet] ? `· ${marks[planet.planet]}` : ""} {planet.retrograde ? "· retrograde" : ""}
          </p>
          {reading ? (
            <>
              <p className="text-cream">{reading.house}</p>
              <p className="text-muted">{reading.sign}</p>
              {reading.lordship && <p className="text-muted">{reading.lordship}</p>}
              <p className="text-muted">{reading.nakshatra}</p>
              {reading.strength && <p className="text-muted">{reading.strength}</p>}
              {reading.flags.map((f) => (
                <p key={f} className="text-rose">
                  {f}
                </p>
              ))}
            </>
          ) : (
            <p className="text-muted">Loading the reading…</p>
          )}
        </div>
      )}
      {pick?.kind === "house" && (
        <div className="mt-4 space-y-2 text-sm leading-relaxed">
          {house ? (
            <>
              <h3 className="text-xl font-bold text-gold-bright">
                {ord(house.house)} house · {house.sanskrit}
              </h3>
              <p className="text-xs text-muted">
                {house.themes} · {house.sign} · {house.strength.verdict} {house.strength.score}/100
              </p>
              <p className="text-cream">{house.summary}</p>
              <p className="text-muted">{house.lordText}</p>
              {house.occupants.map((o) => (
                <p key={o.planet} className="text-muted">
                  <span className="font-semibold text-cream">{o.planet}:</span> {o.text}
                </p>
              ))}
              <p className="text-muted">{house.aspectText}</p>
            </>
          ) : (
            <p className="text-muted">Loading the house reading…</p>
          )}
        </div>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-edge rounded-xl px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-cream">{value}</dd>
    </div>
  );
}

function Card({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return (
    <section className="card-edge flex flex-col rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-muted">{title}</h3>
      <div className="mt-2 flex-1">{children}</div>
      <button type="button" onClick={onAction} className="mt-3 self-start text-xs font-semibold text-gold-bright hover:underline">
        {action}
      </button>
    </section>
  );
}
