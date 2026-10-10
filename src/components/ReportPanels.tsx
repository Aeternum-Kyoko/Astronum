"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import TransitModifiersPanel from "./TransitModifiersPanel";
import SectionSkeleton from "@/components/SectionSkeleton";
import { useMemo, useState } from "react";
import type { KundaliReport } from "@/lib/astrology/report";
import type { KundaliChart } from "@/lib/astrology/types";
import KundliChart, { type ChartPoint } from "@/components/KundliChart";
import SegmentedControl from "@/components/SegmentedControl";
import { transitMarkers } from "@/lib/astrology/chartMarkers";
import { getDignity } from "@/lib/astrology/dignity";
import { currentTransits, type CurrentTransit } from "@/lib/astrology/transits";
import { computeDailyPanchang } from "@/lib/astrology/panchang";
import { DateTime } from "luxon";

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
            <ul className="mt-3 space-y-1 text-xs text-muted">
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

export function TransitsPanel({ report, chart, detailed = false }: { report: KundaliReport | null; chart: KundaliChart; detailed?: boolean }) {
  if (!report) return <Missing />;
  return <TransitExplorer report={report} chart={chart} detailed={detailed} />;
}

function TransitExplorer({ report, chart, detailed }: { report: KundaliReport; chart: KundaliChart; detailed: boolean }) {
  const locale = useLocale(); const L = pick(locale); const n = (text:string)=>term(locale,text);
  const zone = chart.input.timezone;
  const today = DateTime.now().setZone(zone).toISODate()!;
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(() => DateTime.fromISO(today).startOf("month"));
  const at = useMemo(() => DateTime.fromISO(date, { zone }).set({ hour: 12 }).toJSDate(), [date, zone]);
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const transits = useMemo(() => currentTransits(moon.signIndex, chart.ascendant.signIndex, at), [at, moon.signIndex, chart.ascendant.signIndex]);
  const panchang = useMemo(() => {
    try { return computeDailyPanchang(date, chart.input.latitude, chart.input.longitude, zone); }
    catch { return null; }
  }, [date, chart.input.latitude, chart.input.longitude, zone]);
  const marks = transitMarkers(transits.map((t) => ({ planet: t.planet, signIndex: t.signIndex, longitude: t.signIndex * 30 + t.degree, retrograde: t.retrograde })));
  const status = (t: KundaliReport["transits"][number]) => {
    const d = getDignity(t.planet, t.signIndex);
    const parts = [d && d !== "Neutral Sign" ? d : null, marks[t.planet].includes("C") ? "Combust" : null, t.retrograde && t.planet !== "Rahu" && t.planet !== "Ketu" ? "Retrograde" : null].filter(Boolean);
    return { text: parts.map(p=>n(p!)).join(", ") || "—", weak: d === "Debilitated" || d === "Enemy's Sign" || marks[t.planet].includes("C"), strong: d === "Exalted" || d === "Own Sign" };
  };

  const days = Array.from({ length: month.daysInMonth! }, (_, i) => month.set({ day: i + 1 }));
  const blanks = (month.weekday + 6) % 7;
  const stepDate = (amount: number, unit: "day" | "month" | "year") => {
    const next = DateTime.fromISO(date, { zone }).plus({ [unit]: amount }).toISODate()!;
    setDate(next);
    setMonth(DateTime.fromISO(next).startOf("month"));
  };

  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        {L(`Explore past or future positions against your natal Moon (${moon.sign}) and Lagna (${chart.ascendant.sign}).`, `जन्म चंद्र (${n(moon.sign)}) और लग्न (${n(chart.ascendant.sign)}) से भूत या भविष्य के गोचर देखें।`)}
      </p>

      <section className="card-edge rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-bold text-cream">{L("Transit calendar","गोचर कैलेंडर")}</h3><p className="text-xs text-muted">{L("Choose a date to view your personal gochara and Panchang.","अपने गोचर और पंचांग के लिए तिथि चुनें।")}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => stepDate(-1, "day")} className="rounded-lg border border-border px-3 py-2 text-sm text-cream" aria-label={L("Previous day","पिछला दिन")}>←</button>
            <input aria-label={L("Transit date", "गोचर तिथि")} type="date" value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setMonth(DateTime.fromISO(e.target.value).startOf("month")); } }} className="rounded-lg border border-border bg-ink-deep px-3 py-2 text-sm text-cream" />
            <button type="button" onClick={() => stepDate(1, "day")} className="rounded-lg border border-border px-3 py-2 text-sm text-cream" aria-label={L("Next day","अगला दिन")}>→</button>
            <button type="button" onClick={() => { setDate(today); setMonth(DateTime.fromISO(today).startOf("month")); }} className="rounded-lg border border-gold/50 px-3 py-2 text-sm font-semibold text-gold-bright">{L("Today","आज")}</button>
          </div>
        </div>
        <div className="mt-5 max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(month.minus({ months: 1 }))} className="rounded-lg border border-border px-3 py-1.5 text-sm text-cream" aria-label={L("Previous month","पिछला महीना")}>←</button>
            <div className="flex items-center gap-2 font-semibold text-cream">
              <select aria-label={L("Month","महीना")} value={month.month} onChange={(e) => setMonth(month.set({ month: Number(e.target.value) }))} className="rounded-lg border border-border bg-ink-deep px-2 py-1.5">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{DateTime.local(2024, i + 1).setLocale(locale).toFormat("LLLL")}</option>)}</select>
              <select aria-label={L("Year","वर्ष")} value={month.year} onChange={(e) => setMonth(month.set({ year: Number(e.target.value) }))} className="rounded-lg border border-border bg-ink-deep px-2 py-1.5">{Array.from({ length: 201 }, (_, i) => month.year - 100 + i).map((y) => <option key={y}>{y}</option>)}</select>
            </div>
            <button type="button" onClick={() => setMonth(month.plus({ months: 1 }))} className="rounded-lg border border-border px-3 py-1.5 text-sm text-cream" aria-label={L("Next month","अगला महीना")}>→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">{(locale === "hi" ? ["सो","मं","बु","गु","शु","श","र"] : ["M", "T", "W", "T", "F", "S", "S"]).map((d, i) => <span key={`${d}${i}`} className="py-1">{d}</span>)}
            {Array.from({ length: blanks }, (_, i) => <span key={`blank${i}`} />)}
            {days.map((d) => { const iso = d.toISODate()!; return <button type="button" key={iso} onClick={() => setDate(iso)} aria-pressed={date === iso} className={`rounded-lg py-2 font-tabular ${date === iso ? "bg-gold font-bold text-on-gold" : iso === today ? "border border-gold/50 text-gold-bright" : "text-cream hover:bg-surface-raised"}`}>{d.day}</button>; })}
          </div>
        </div>
      </section>

      <TransitChart transits={transits} chart={chart} date={date} />

      {panchang ? <section className="card-edge rounded-2xl p-5">
        <h3 className="text-lg font-bold text-cream">{L("Panchang","पंचांग")} · {DateTime.fromISO(date, { zone }).setLocale(locale).toFormat("cccc, d LLLL yyyy")}</h3>
        <p className="mt-1 text-xs text-muted">{chart.input.place} · {zone} · {L("Panchang limbs at local sunrise","पंचांग अंग स्थानीय सूर्योदय पर")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[["Vara", `${panchang.vara.name} · ${panchang.vara.sanskrit}`], ["Tithi", `${panchang.tithi.paksha} ${panchang.tithi.name}`], ["Nakshatra", panchang.nakshatra.name], ["Yoga", panchang.yoga.name], ["Karana", panchang.karana.name], ["Moon sign", panchang.moonSign.name], ["Sun sign", panchang.sunSign], ["Sunrise", DateTime.fromJSDate(panchang.sunrise).setZone(zone).toFormat("h:mm a")], ["Sunset", DateTime.fromJSDate(panchang.sunset).setZone(zone).toFormat("h:mm a")], ["Rahu Kaal", `${DateTime.fromJSDate(panchang.rahuKaal.start).setZone(zone).toFormat("h:mm a")} – ${DateTime.fromJSDate(panchang.rahuKaal.end).setZone(zone).toFormat("h:mm a")}`]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface/70 p-3"><p className="text-[11px] uppercase tracking-wide text-muted">{n(label)}</p><p className="mt-1 text-sm font-semibold text-cream">{n(value)}</p></div>)}
        </div>
      </section> : <section className="card-edge rounded-2xl p-5 text-sm text-muted">{L("Panchang timings are unavailable for this date and location.","इस तिथि और स्थान का पंचांग समय उपलब्ध नहीं है।")}</section>}

      <section className="card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <caption className="px-5 pt-5 text-left">
            <span className="block text-lg font-bold text-cream">{L("Transits on","गोचर तिथि")} {DateTime.fromISO(date, { zone }).toFormat("d LLL yyyy")}</span>
            <span className="text-xs text-muted">{L("Calculated at 12:00 in the birth-place timezone, from your natal Moon and Lagna", "जन्मस्थान समय क्षेत्र में 12:00 बजे की गणना, जन्म चंद्र और लग्न से")}</span>
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
              <th className="px-4 py-3">{L("Planet","ग्रह")}</th>
              <th className="px-4 py-3">{L("Transit sign","गोचर राशि")}</th>
              <th className="px-4 py-3">{L("Status","स्थिति")}</th>
              <th className="px-4 py-3">{L("From Moon","चंद्र से")}</th>
              <th className="px-4 py-3">{L("From Lagna","लग्न से")}</th>
              <th className="px-4 py-3">{L("Effect","फल")}</th>
              <th className="px-4 py-3">{L("Next sign change","अगला राशि प्रवेश")}</th>
            </tr>
          </thead>
          <tbody>
            {transits.map((t) => (
              <tr key={n(t.planet)} className="border-b border-border/50 whitespace-nowrap last:border-0">
                <td className="px-4 py-2.5 font-medium text-cream">
                  {n(t.planet)}
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
                  {n(t.sign)} {t.degree.toFixed(1)}°
                </td>
                <td className={`px-4 py-2.5 ${status(t).strong ? "font-semibold text-gold-bright" : status(t).weak ? "text-rose" : "text-muted"}`}>{status(t).text}</td>
                <td className="px-4 py-2.5 text-muted">{t.houseFromMoon}</td>
                <td className="px-4 py-2.5 text-muted">{t.houseFromLagna}</td>
                <td className={`px-4 py-2.5 font-semibold ${t.favourable ? "text-gold-bright" : "text-rose"}`}>{t.favourable ? L("Favourable","अनुकूल") : L("Challenging","चुनौतीपूर्ण")}</td>
                <td className="px-4 py-2.5 text-muted">{t.next ? `${n(t.next.sign)} · ${new Date(t.next.date).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {timeZone:zone})}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <TransitModifiersPanel chart={chart} transits={transits} at={at} detailed={detailed} />
      <SaturnTimeline report={report} now={at} />
    </div>
  );
}

/** Today's planets placed in the natal chart's houses — from the Lagna, or from the Moon as gochara is read. */
function TransitChart({ transits, chart, date }: { transits: CurrentTransit[]; chart: KundaliChart; date: string }) {
  const [from, setFrom] = useState<"lagna" | "moon">("lagna");
  const moonSign = chart.planets.find((p) => p.planet === "Moon")!.signIndex;
  const reference = from === "lagna" ? chart.ascendant.signIndex : moonSign;
  const marks = transitMarkers(transits.map((t) => ({ planet: t.planet, signIndex: t.signIndex, longitude: t.signIndex * 30 + t.degree, retrograde: t.retrograde })));
  const points: ChartPoint[] = transits.map((t) => ({
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
      <h3 className="text-lg font-bold text-cream">Transit chart · {DateTime.fromISO(date).toFormat("d LLL yyyy")}</h3>
      <p className="mt-1 text-xs text-muted">
        Planet positions drawn in your natal houses. The highlighted house is your {from === "lagna" ? `Lagna (${chart.ascendant.sign})` : `Moon sign`}.
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
