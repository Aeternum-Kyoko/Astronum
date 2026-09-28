"use client";

import SectionSkeleton from "@/components/SectionSkeleton";
import { useState } from "react";
import type { KundaliReport } from "@/lib/astrology/report";
import type { KundaliChart } from "@/lib/astrology/types";
import KundliChart, { type ChartPoint } from "@/components/KundliChart";
import SegmentedControl from "@/components/SegmentedControl";
import { transitMarkers } from "@/lib/astrology/chartMarkers";
import { getDignity } from "@/lib/astrology/dignity";

// Report dates arrive from the API as ISO strings; wrap every one in new Date().
const monthYear = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" });
const fullDate = (d: Date | string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-wider" role="img" aria-label={`${rating} out of 5`}>
      <span className="text-gold-bright">{"★".repeat(rating)}</span>
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function Missing() {
  return <SectionSkeleton />;
}

export function LifeReportPanel({ report }: { report: KundaliReport | null }) {
  if (!report) return <Missing />;
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Each area of life is judged from its houses, their lords, the planets in them and the natural significators —
        with the upcoming dasha periods that bring it into focus.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {report.lifeAreas.map((a) => (
          <section key={a.key} className="card-edge flex flex-col rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-cream">{a.title}</h3>
              <span className="shrink-0 text-right">
                <Stars rating={a.rating} />
                <span className={`block text-xs font-semibold ${a.verdict === "Strong" ? "text-gold-bright" : a.verdict === "Weak" ? "text-rose" : "text-muted"}`}>
                  {a.verdict}
                </span>
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-cream">{a.summary}</p>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
              {a.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-gold" aria-hidden="true">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {a.periods.length > 0 && (
              <div className="mt-auto pt-4">
                <p className="text-xs font-semibold text-gold-bright">When it comes into focus</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {a.periods.map((p) => (
                    <li key={`${p.label}-${p.start}`} className="flex justify-between gap-3">
                      <span className="text-cream">
                        {p.label} <span className="text-muted">({p.why})</span>
                      </span>
                      <span className="shrink-0 font-tabular text-muted">
                        {monthYear(p.start)} – {monthYear(p.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export function PlanetReadingsPanel({ report }: { report: KundaliReport | null }) {
  if (!report) return <Missing />;
  return (
    <div className="space-y-4">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        What each planet means in your chart — by the house it occupies, the sign it colours, its nakshatra, the houses
        it rules and how strong it is.
      </p>
      {report.planets.map((r) => (
        <section key={r.planet} className="card-edge rounded-2xl p-6">
          <h3 className="text-lg font-bold text-cream">{r.headline}</h3>
          <p className="mt-3 text-base leading-relaxed text-cream">{r.house}</p>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <p>{r.sign}</p>
            <p>{r.nakshatra}</p>
            {r.lordship && <p>{r.lordship}</p>}
            {r.strength && <p>{r.strength}</p>}
          </div>
          {r.flags.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-rose/90">
              {r.flags.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export function TransitsPanel({ report, chart }: { report: KundaliReport | null; chart: KundaliChart }) {
  if (!report) return <Missing />;
  const now = new Date(report.generatedAt);
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const marks = transitMarkers(report.transits.map((t) => ({ planet: t.planet, signIndex: t.signIndex, longitude: t.signIndex * 30 + t.degree, retrograde: t.retrograde })));
  const status = (t: KundaliReport["transits"][number]) => {
    const d = getDignity(t.planet, t.signIndex);
    const parts = [d && d !== "Neutral Sign" ? d : null, marks[t.planet].includes("C") ? "Combust" : null, t.retrograde && t.planet !== "Rahu" && t.planet !== "Ketu" ? "Retrograde" : null].filter(Boolean);
    return { text: parts.join(", ") || "—", weak: d === "Debilitated" || d === "Enemy's Sign" || marks[t.planet].includes("C"), strong: d === "Exalted" || d === "Own Sign" };
  };

  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Where the planets are today, read from your natal Moon ({moon.sign}) — the classical gochara method — and from
        your Lagna ({chart.ascendant.sign}).
      </p>

      <TransitChart report={report} chart={chart} />

      <section className="card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <caption className="px-5 pt-5 text-left">
            <span className="block text-lg font-bold text-cream">Current transits</span>
            <span className="text-xs text-muted">As of {fullDate(now)}</span>
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
              <th className="px-4 py-3">Planet</th>
              <th className="px-4 py-3">Transit sign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">From Moon</th>
              <th className="px-4 py-3">From Lagna</th>
              <th className="px-4 py-3">Effect</th>
              <th className="px-4 py-3">Next sign change</th>
            </tr>
          </thead>
          <tbody>
            {report.transits.map((t) => (
              <tr key={t.planet} className="border-b border-border/50 whitespace-nowrap last:border-0">
                <td className="px-4 py-2.5 font-medium text-cream">
                  {t.planet}
                  {marks[t.planet] && (
                    <span className="ml-1 text-xs">
                      {[...marks[t.planet]].map((m, i) => (
                        <span key={i} className={m === "↑" ? "text-gold-bright" : "text-rose"}>
                          {m}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {t.sign} {t.degree.toFixed(1)}°
                </td>
                <td className={`px-4 py-2.5 ${status(t).strong ? "font-semibold text-gold-bright" : status(t).weak ? "text-rose" : "text-muted"}`}>{status(t).text}</td>
                <td className="px-4 py-2.5 text-muted">{ordinal(t.houseFromMoon)}</td>
                <td className="px-4 py-2.5 text-muted">{ordinal(t.houseFromLagna)}</td>
                <td className={`px-4 py-2.5 font-semibold ${t.favourable ? "text-gold-bright" : "text-rose"}`}>{t.favourable ? "Favourable" : "Challenging"}</td>
                <td className="px-4 py-2.5 text-muted">{t.next ? `${t.next.sign} · ${fullDate(t.next.date)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SaturnTimeline report={report} now={now} />
    </div>
  );
}

/** Today's planets placed in the natal chart's houses — from the Lagna, or from the Moon as gochara is read. */
function TransitChart({ report, chart }: { report: KundaliReport; chart: KundaliChart }) {
  const [from, setFrom] = useState<"lagna" | "moon">("lagna");
  const moonSign = chart.planets.find((p) => p.planet === "Moon")!.signIndex;
  const reference = from === "lagna" ? chart.ascendant.signIndex : moonSign;
  const marks = transitMarkers(report.transits.map((t) => ({ planet: t.planet, signIndex: t.signIndex, longitude: t.signIndex * 30 + t.degree, retrograde: t.retrograde })));
  const points: ChartPoint[] = report.transits.map((t) => ({
    planet: t.planet,
    signIndex: t.signIndex,
    house: from === "lagna" ? t.houseFromLagna : t.houseFromMoon,
    retrograde: t.retrograde,
    markers: marks[t.planet],
    dignity: getDignity(t.planet, t.signIndex),
    sign: t.sign,
    degreeInSign: t.degree,
  }));
  return (
    <section className="card-edge rounded-2xl p-6">
      <h3 className="text-lg font-bold text-cream">Transit chart</h3>
      <p className="mt-1 text-xs text-muted">
        Where the planets are today, drawn in your own houses. The highlighted house is your {from === "lagna" ? `Lagna (${chart.ascendant.sign})` : `Moon sign`}.
      </p>
      <div className="mt-4 mb-5 flex justify-center">
        <SegmentedControl
          layoutId="transit-reference"
          value={from}
          onChange={setFrom}
          options={[
            { value: "lagna", label: "From Lagna" },
            { value: "moon", label: "From Moon" },
          ]}
        />
      </div>
      <KundliChart ascendantSignIndex={reference} planets={points} toggleId="transit-style" />
    </section>
  );
}

function SaturnTimeline({ report, now }: { report: KundaliReport; now: Date }) {
  const [showAll, setShowAll] = useState(false);
  const cycles = report.saturnCycles;
  const upcomingOrCurrent = cycles.filter((c) => new Date(c.end) >= now);
  const shown = showAll ? cycles : upcomingOrCurrent.slice(0, 4);

  return (
    <section className="card-edge rounded-2xl p-6">
      <h3 className="text-lg font-bold text-cream">Sade Sati &amp; Shani Dhaiya timeline</h3>
      <p className="mt-1 text-xs text-muted">
        Saturn&rsquo;s passage through the 12th, 1st and 2nd from your Moon (Sade Sati, about 7½ years) and the 4th and
        8th (Kantaka and Ashtama Shani, about 2½ years each).
      </p>
      <ol className="mt-5 space-y-3">
        {shown.map((c) => {
          const current = new Date(c.start) <= now && now < new Date(c.end);
          return (
            <li key={`${c.kind}-${c.start}`} className={`rounded-xl border p-4 ${current ? "border-gold/50 bg-gold/5" : "border-border/70"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={`font-semibold ${c.kind === "Sade Sati" ? "text-gold-bright" : "text-cream"}`}>
                  {c.kind}
                  {current && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-on-gold">Now</span>}
                </p>
                <p className="font-tabular text-sm text-muted">
                  {monthYear(c.start)} – {monthYear(c.end)}
                </p>
              </div>
              {c.kind === "Sade Sati" && (
                <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-3">
                  {c.phases
                    .filter((p) => p.phase)
                    .map((p) => (
                      <li key={`${p.start}`}>
                        {p.phase} · {monthYear(p.start)} – {monthYear(p.end)}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      {cycles.length > shown.length || showAll ? (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-4 text-sm font-semibold text-gold-bright hover:text-gold">
          {showAll ? "Show current and upcoming only" : `Show all ${cycles.length} periods in your lifetime`}
        </button>
      ) : null}
    </section>
  );
}
