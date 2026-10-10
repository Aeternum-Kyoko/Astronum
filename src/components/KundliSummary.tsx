"use client";
import { ruleSupport } from "@/lib/astrology/ruleSupport";

import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick as choose } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { useMemo, useState } from "react";
import KundliChart, { type ChartPick, type ChartStyle } from "@/components/KundliChart";
import ShareBar from "@/components/ShareBar";
import { natalMarkers } from "@/lib/astrology/chartMarkers";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { drawChartCard, canvasToBlob } from "@/lib/chartImage";
import { toBirthQuery } from "@/lib/birthParams";
import type { KundaliChart } from "@/lib/astrology/types";
import type { KundaliReport } from "@/lib/astrology/report";

const LEVEL = ["Mahadasha", "Antardasha", "Pratyantardasha"];
/**
 * The kundli's opening view. One hero — the chart, explorable by tapping —
 * with "right now" beside it, the whole life as a strip beneath, then quiet
 * lists that lead into each section.
 */
export default function KundliSummary({ chart, report, go, style, setStyle }: { chart: KundaliChart; report: KundaliReport | null; go: (slug: string) => void; style: ChartStyle; setStyle: (s: ChartStyle) => void }) {
  const locale = useLocale(); const L = choose(locale); const n = (text:string)=>term(locale,text);
  const [pick, setPick] = useState<ChartPick | null>(null);
  const marks = useMemo(() => natalMarkers(chart), [chart]);
  const points = chart.planets.map(p=>({...p,markers:marks[p.planet]}));
  const now = new Date(report?.generatedAt ?? chart.utcDate);
  const running = periodsAt(chart.dashas, now, 3);
  const moon=chart.planets.find(p=>p.planet==="Moon")!;
  const change=running.length?running.reduce((a,b)=>a.end<b.end?a:b):null;
  const date=(d:Date|string)=>new Date(d).toLocaleDateString(locale==="hi"?"hi-IN":"en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:chart.input.timezone});
  const [savedPrecision]=useDeviceStore<string>(`astronum-precision:${toBirthQuery(chart.input)}`,"unknown");
  const precision=["0","5","15","30"].includes(savedPrecision)?savedPrecision:"unknown";
  const makeImage=()=>canvasToBlob(drawChartCard({style,ascendantSignIndex:chart.ascendant.signIndex,planets:points,title:chart.input.name,subtitle:`${chart.ascendant.sign} Lagna · ${moon.sign} Moon`,footer:"astronum"}));
  const url=typeof window!=="undefined"?`${window.location.origin}/kundali?${toBirthQuery(chart.input)}`:"";
  return <div className="space-y-8">
    <div className="grid gap-8 xl:grid-cols-[1.1fr_1fr]">
      <section className="min-w-0 rounded-3xl border border-gold/25 bg-surface/30 p-4 sm:p-6" aria-label={L("Birth chart","जन्म कुंडली")}>
        <div className="mb-4 flex items-baseline justify-between"><h2 className="text-lg font-semibold text-cream">{L("Your birth chart","आपकी जन्म कुंडली")}</h2><span className="text-xs text-gold-bright">D1 · {L("Lahiri","लाहिड़ी")}</span></div>
        <KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={points} style={style} onStyleChange={setStyle} toggleId="summary-style" onPick={setPick} selected={pick}/>
        <div className="mt-4 flex flex-wrap justify-between gap-3"><p className="text-xs text-muted">{L("Select a planet or house to explore it.","ग्रह या भाव चुनकर विवरण पढ़ें।")}</p><ShareBar url={url} title={chart.input.name} fileName="birth-chart.png" makeImage={makeImage}/></div>
        <PickDetail chart={chart} report={report} pick={pick} marks={marks} onClose={()=>setPick(null)}/>
      </section>
      <section className="rounded-3xl border border-border p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-widest text-gold-bright">{L("Your current chapter","आपका वर्तमान अध्याय")}</p><h2 className="mt-4 text-3xl font-bold leading-tight text-cream">{running.map(p=>n(p.lord)).join(" › ")||"—"}</h2><p className="mt-2 text-xs text-muted">{running.map((_,i)=>n(LEVEL[i])).join(" › ")}</p>{!report&&<p className="mt-2 text-xs text-muted">{L("Current timing will appear when the report loads.","रिपोर्ट आने पर वर्तमान समय-संदर्भ दिखेगा।")}</p>}
        <dl className="mt-6 divide-y divide-border"><Row label={L("Ascendant","लग्न")} value={`${n(chart.ascendant.sign)} ${chart.ascendant.degreeInSign.toFixed(2)}°`}/><Row label={L("Moon","चंद्र")} value={`${n(moon.sign)} · ${n(moon.nakshatra)} / ${moon.pada}`}/>{change&&<Row label={L("Next dasha change","अगला दशा बदलाव")} value={date(change.end)}/>}<Row label={L("Sade Sati","साढ़ेसाती")} value={chart.sadeSati.active?L("Active","सक्रिय"):L("Not active","सक्रिय नहीं")}/></dl>
        <button type="button" onClick={()=>go("dashas")} className="mt-5 text-sm font-semibold text-gold-bright">{L("Explore this period →","यह अवधि पढ़ें →")}</button>
        <div className="mt-6 rounded-2xl border border-gold/25 p-4"><p className="text-sm font-semibold text-cream">{L("Birth-time precision","जन्म-समय सटीकता")}: {precision==="unknown"?L("Not documented","दर्ज नहीं"):precision==="0"?L("Recorded exact time","दर्ज सटीक समय"):`±${precision} ${L("minutes","मिनट")}`}</p><p className="mt-2 text-xs leading-relaxed text-muted">{L("Check the interval before relying on divisional houses or fine timing.","वर्ग भाव या सूक्ष्म समय पर निर्भर होने से पहले अंतराल जाँचें।")}</p><button type="button" onClick={()=>go("precision")} className="mt-3 text-xs font-semibold text-gold-bright">{L("Check what changes →","बदलाव जाँचें →")}</button></div>
      </section>
    </div>
    <section><div className="mb-4 flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-2xl font-bold text-cream">{L("Explore an area of life","जीवन का विषय चुनें")}</h2><p className="text-xs text-muted">{L("Supporting factors · challenges · timing","सहायक संकेत · चुनौतियाँ · समय")}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[["relationships",L("Relationships","संबंध"),"D9",L("Partnership, commitment and communication","साझेदारी, प्रतिबद्धता और संवाद")],["wealth",L("Wealth","धन"),"D2",L("Earnings, savings and resources","आय, बचत और संसाधन")],["career",L("Career","करियर"),"D10",L("Work, progress and public standing","कार्य, प्रगति और प्रतिष्ठा")],["education",L("Education","शिक्षा"),"D24",L("Learning, qualifications and guidance","अध्ययन, योग्यता और मार्गदर्शन")],["property",L("Home & property","घर और संपत्ति"),"D4 / D16",L("Stability, home and comfort","स्थिरता, घर और सुख")],["transits",L("Current transits","वर्तमान गोचर"),L("Gochara","गोचर"),L("Moorti, tara, friendship and Ashtakavarga","मूर्ति, तारा, मैत्री और अष्टकवर्ग")]].map(([slug,title,varga,description])=><button type="button" key={slug} onClick={()=>go(slug)} className="group rounded-2xl border border-border bg-surface/30 p-5 text-left transition-colors hover:border-gold/50"><div className="flex justify-between gap-2"><h3 className="text-lg font-semibold text-cream">{title}</h3><span className="text-xs text-gold-bright">{varga}</span></div><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p><span className="mt-4 block text-xs font-semibold text-gold-bright">{L("Read your chart →","अपनी कुंडली पढ़ें →")}</span></button>)}</div></section>
    {report?.timeline&&<section className="rounded-2xl border border-border p-5"><h2 className="text-xl font-semibold text-cream">{L("Upcoming activation windows","आने वाली सक्रिय अवधियाँ")}</h2><ul className="mt-4 grid gap-4 md:grid-cols-3">{report.timeline.keyWindows.filter(w=>new Date(w.end)>now).slice(0,3).map(w=><li key={w.kind} className="border-l-2 border-gold/40 pl-4"><p className="font-medium text-cream">{w.label}</p><p className="mt-1 text-xs text-muted">{date(w.start)} – {date(w.end)}</p><p className="mt-2 text-xs text-gold-bright">{ruleSupport(w.confidence,locale)}</p></li>)}</ul><p className="mt-4 text-xs text-muted">{L("Grades summarize traditional indicators; they are not event probabilities.","श्रेणियाँ पारंपरिक संकेतों का सार हैं; घटना की संभावनाएँ नहीं।")}</p><button type="button" onClick={()=>go("timeline")} className="mt-3 text-sm font-semibold text-gold-bright">{L("Open the timeline →","समयरेखा खोलें →")}</button></section>}
    <div className="flex flex-wrap gap-3">{[["compare",L("Compare charts","कुंडली तुलना")],["journal",L("Record life events","जीवन घटनाएँ दर्ज करें")],["calculations",L("View calculation details","गणना विवरण देखें")]].map(([slug,label])=><button type="button" key={slug} onClick={()=>go(slug)} className="rounded-full border border-border px-4 py-2 text-sm text-cream">{label}</button>)}</div>
  </div>;
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`text-right font-medium ${tone ?? "text-cream"}`}>{value}</dd>
    </div>
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

function PickDetail({ chart, report, pick, marks, onClose }: { chart: KundaliChart; report: KundaliReport | null; pick: ChartPick | null; marks: Record<string, string>; onClose: () => void }) {
  const locale = useLocale(); const L = choose(locale);
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
              {term(locale,planet.planet)} <span className="text-base font-normal text-muted">{term(locale,planet.sign)} · {L("House","भाव")} {planet.house}</span>
            </>
          ) : (
            <>
              {L("House","भाव")} {pick.kind === "house" ? pick.house : 1} {house && <span className="text-base font-normal text-muted">({house.sanskrit})</span>}
            </>
          )}
        </h3>
        <button type="button" onClick={onClose} aria-label={L("Close","बंद करें")} className="-mt-1 -mr-2 rounded-full p-2.5 text-muted hover:text-cream">
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
