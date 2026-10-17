"use client";
import { useMemo } from "react";
import { useAnalysis } from "./AnalysisContext";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { readingEvidence } from "@/lib/astrology/readingEvidence";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import KundliChart from "../KundliChart";
import { ChartStyleButtons } from "./ChartPicker";
import TimingStrip from "./TimingStrip";
import EvidenceEntry from "../EvidenceEntry";
export default function WorkspaceOverview({ chart, expert, go }: { chart: KundaliChart; expert: boolean; go: (slug: string) => void }) {
  const a = useAnalysis()!; const locale = useLocale(); const L = pick(locale); const n = (s: string) => term(locale, s);
  const running = periodsAt(chart.dashas, a.at, 3);
  const evidence = useMemo(() => readingEvidence(chart, [1, 7, 10], ["D9", "D10"], a.at, null, locale), [chart, a.at, locale]);
  const moon = chart.planets.find(p => p.planet === "Moon");
  return <div className="overview-desk">
    <section className="overview-atlas" aria-label={L("Birth charts and timing", "जन्म कुंडलियाँ और दशाएँ")}>
      <div className="atlas-heading"><div><h2>{L("Your celestial atlas", "आपकी जन्म कुंडली")}</h2><p>{chart.input.date} · {chart.input.time} · {chart.input.place}</p></div><ChartStyleButtons value={a.style} onChange={style => a.update({ style })} /></div>
      <div className="atlas-charts">{(["D1", "D9"] as const).map(key => <article key={key} className="atlas-chart"><header><span>{key}</span><div><h3>{key === "D1" ? L("Rashi · Birth chart", "राशि · जन्म कुंडली") : L("Navamsa · Inner potential", "नवांश · आंतरिक क्षमता")}</h3><p>{key === "D1" ? L("The foundation of your reading", "आपके विश्लेषण का आधार") : L("Read alongside D1; sensitive to birth time", "D1 के साथ देखें; जन्म-समय संवेदनशील")}</p></div></header><KundliChart style={a.style} ascendantSignIndex={chart.divisionalCharts[key].ascendant.signIndex} planets={chart.divisionalCharts[key].planets} selected={a.selected} onPick={selected => a.update({ selected })} ariaLabel={`${key} ${L("overview chart", "अवलोकन कुंडली")}`} /><button type="button" className="atlas-open" onClick={() => go(key === "D1" ? "rasi" : "navamsa")}>{L("Open chart and details", "कुंडली और विवरण खोलें")}</button></article>)}</div>
      <p className="atlas-mobile-hint">{L("Swipe to compare D1 and D9. Tap a planet to highlight it in both charts.", "D1 और D9 देखने के लिए स्वाइप करें। दोनों में ग्रह चिह्नित करने हेतु टैप करें।")}</p>
      {a.selected && <button className="atlas-selection" type="button" onClick={() => go("rasi")}>{a.selected.kind === "planet" ? n(a.selected.planet) : `${L("House", "भाव")} ${a.selected.house}`} · {L("Inspect placement and evidence", "स्थिति और प्रमाण देखें")}</button>}
      <TimingStrip chart={chart} go={go} />
      <section className="overview-strength"><header><div><h3>{L("Planetary strength", "ग्रह बल")}</h3><p>{L("Approximate Shadbala · rupas / classical minimum", "अनुमानित षड्बल · रूपा / शास्त्रीय न्यूनतम")}</p></div><button type="button" onClick={() => go("shadbala")}>{L("All components", "सभी घटक")}</button></header><div className="strength-rows">{chart.shadbala.map(s => <button type="button" key={s.planet} onClick={() => { a.update({ selected: { kind: "planet", planet: s.planet } }); go("shadbala"); }}><span>{n(s.planet)}</span><span className="strength-track"><span style={{ width: `${Math.max(0, Math.min(100, s.rupas / s.requiredRupas * 50))}%` }} /></span><strong>{s.rupas.toFixed(2)} <small>/ {s.requiredRupas}</small></strong></button>)}</div><p>{L("The midpoint marks the classical minimum. Some time and motion components are incomplete; this is not a complete classical strength verdict.", "मध्य चिह्न शास्त्रीय न्यूनतम है। कुछ काल और गति घटक अपूर्ण हैं; यह पूर्ण शास्त्रीय बल-निर्णय नहीं है।")}</p></section>
    </section>
    <div className="workspace-overview"><header><h2>{expert ? L("Analysis desk", "विश्लेषण डेस्क") : L("Your chart at a glance", "आपकी कुंडली एक नज़र में")}</h2><p className="mt-2 text-sm text-muted">{expert ? L("Inspect a planet, compare charts, and follow its evidence and timing.", "ग्रह देखें, कुंडलियाँ तुलना करें और प्रमाण व समय जाँचें।") : L("Start with your birth chart, then explore its timing and life areas.", "जन्म कुंडली से शुरू करें, फिर दशा और जीवन के क्षेत्र देखें।")}</p></header>
    {<dl className="overview-facts"><div><dt>{L("Ascendant", "लग्न")}</dt><dd>{n(chart.ascendant.sign)}</dd></div><div><dt>{L("Moon sign", "चंद्र राशि")}</dt><dd>{moon ? n(moon.sign) : "—"}</dd></div><div><dt>{L("Birth nakshatra", "जन्म नक्षत्र")}</dt><dd>{moon ? n(moon.nakshatra) : "—"}</dd></div></dl>}
    <section className="overview-period"><h3>{L("Period at the analysis date", "विश्लेषण तिथि की दशा")}</h3><p className="mt-2 text-xl text-gold-bright">{running.map(p => n(p.lord)).join(" › ") || L("Outside calculated range", "गणना सीमा से बाहर")}</p><button type="button" onClick={() => go("dashas")} className="mt-3 text-sm text-gold-bright underline">{L("Explore this period", "यह दशा देखें")}</button></section>
    <div className="overview-topics">{[["Career", "career", "D10"], ["Relationships", "relationships", "D9"], ["Wealth", "wealth", "D2"], ["Education", "education", "D24"], ["Property", "property", "D4"]].map(([title, slug, varga]) => <button type="button" key={slug} onClick={() => { a.update({ primary: "D1", secondary: varga as typeof a.primary, compare: expert }); go(slug); }}><span>{n(title)}</span><span className="text-xs text-muted">D1 + {varga}</span></button>)}</div>
    <section><h3>{L("Chart evidence to start with", "प्रारंभिक कुंडली प्रमाण")}</h3><div className="mt-3 space-y-4">{evidence.map(c => <div key={c.house}><p className="mb-2 text-xs text-muted">{L("House", "भाव")} {c.house} · {n(c.lord)}{c.mixed && ` · ${L("Mixed indicators", "मिश्रित संकेत")}`}</p>{c.items.slice(0, expert ? 4 : 2).map(e => <EvidenceEntry key={e.id} evidence={e} go={go} />)}</div>)}</div></section>
    <div className="mt-6 flex flex-wrap gap-3 text-xs text-gold-bright"><button type="button" onClick={() => go("precision")}>{L("Review birth-time precision", "जन्म-समय सटीकता जाँचें")}</button><button type="button" onClick={() => go("journal")}>{L("Record a life event", "जीवन घटना दर्ज करें")}</button><button type="button" onClick={() => go("calculations")}>{L("Calculation settings", "गणना सेटिंग्स")}</button></div>
  </div></div>;
}
