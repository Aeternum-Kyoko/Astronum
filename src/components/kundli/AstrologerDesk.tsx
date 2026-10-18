"use client";

import { useMemo } from "react";
import KundliChart from "../KundliChart";
import EvidenceEntry from "../EvidenceEntry";
import { useAnalysis } from "./AnalysisContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { natalMarkers, MARKER_MEANING, type Marker } from "@/lib/astrology/chartMarkers";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { readingEvidence } from "@/lib/astrology/readingEvidence";
import { topicReading, type TopicKey } from "@/lib/astrology/topicReading";
import type { KundaliChart } from "@/lib/astrology/types";
import { useDeviceStore } from "@/lib/useDeviceStore";
import { toBirthQuery } from "@/lib/birthParams";
import BirthReliabilityBadge from "./BirthReliabilityBadge";

const TOPICS: { key: TopicKey; slug: string; title: [string, string]; varga: string }[] = [
  { key: "career", slug: "career", title: ["Career", "करियर"], varga: "D10" },
  { key: "relationships", slug: "relationships", title: ["Relationships", "संबंध"], varga: "D9" },
  { key: "wealth", slug: "wealth", title: ["Resources", "संसाधन"], varga: "D2" },
];

export default function AstrologerDesk({ chart, go }: { chart: KundaliChart; go: (slug: string) => void }) {
  const a = useAnalysis()!;
  const locale = useLocale();
  const L = pick(locale);
  const n = (value: string) => term(locale, value);
  const running = periodsAt(chart.dashas, a.at, 3);
  const [precision] = useDeviceStore<string>(`astronum-precision:${toBirthQuery(chart.input)}`, "unknown");
  const readings = useMemo(() => TOPICS.map(topic => ({ ...topic, result: topicReading(chart, topic.key, a.at, locale, a.transits) })), [chart, a.at, a.transits, locale]);
  const evidence = useMemo(() => readingEvidence(chart, [1, 7, 10], ["D9", "D10"], a.at, a.transits, locale), [chart, a.at, a.transits, locale]);
  const marks = useMemo(() => natalMarkers(chart), [chart]);
  const flagged = chart.planets.flatMap(planet => [...(marks[planet.planet] ?? "")].filter((symbol): symbol is Marker => symbol in MARKER_MEANING).map(symbol => ({ planet: planet.planet, symbol, meaning: MARKER_MEANING[symbol] })));
  return <div className="astrologer-desk">
    <header className="desk-intro"><div><h2>{L("The investigation desk", "विश्लेषण कार्यक्षेत्र")}</h2><p>{L("Begin with chart condition, test a question, then inspect timing and contrary evidence.", "कुंडली की स्थिति से शुरू करें, प्रश्न जाँचें, फिर समय और विरोधी प्रमाण देखें।")}</p></div><div className="desk-period"><span>{L("Running Vimshottari", "वर्तमान विंशोत्तरी")}</span><strong>{running.map(period => n(period.lord)).join(" › ") || "—"}</strong><button type="button" onClick={() => go("dashas")}>{L("Inspect periods", "दशाएँ देखें")}</button></div></header>
    <div className="desk-quality"><span>{L("Birth-time reliability", "जन्म-समय विश्वसनीयता")}: <strong>{precision === "unknown" ? L("unrecorded", "अदर्ज") : precision === "0" ? L("recorded exact", "सटीक दर्ज") : `±${precision} ${L("minutes", "मिनट")}`}</strong></span><span>{L("Reference", "संदर्भ")}: <strong>{a.date} · {a.time} · {a.zone}</strong></span><button type="button" onClick={() => go("precision")}>{L("Test sensitivity", "संवेदनशीलता जाँचें")}</button></div>
    <section className="desk-charts" aria-label={L("Foundational charts", "मुख्य कुंडलियाँ")}>
      {(["D1", "D9", "D10"] as const).map(key => <article key={key}><div className="desk-chart-heading"><div><span>{key}</span><h3>{key === "D1" ? L("Natal promise", "जन्म संकेत") : key === "D9" ? L("Underlying strength", "आंतरिक बल") : L("Professional lens", "व्यावसायिक संदर्भ")}</h3></div><button type="button" onClick={() => go(key === "D1" ? "rasi" : key === "D9" ? "navamsa" : "vargas")}>{L("Open", "खोलें")}</button></div>{key !== "D1" && <BirthReliabilityBadge chart={chart} varga={key} go={go} />}<KundliChart style={a.style} ascendantSignIndex={chart.divisionalCharts[key].ascendant.signIndex} planets={key === "D1" ? chart.planets.map(planet => ({ ...planet, markers: marks[planet.planet] })) : chart.divisionalCharts[key].planets} selected={a.selected} onPick={selected => a.update({ selected })} ariaLabel={`${key} ${L("chart", "कुंडली")}`} /></article>)}
    </section>
    <section className="desk-topic-section"><div className="desk-section-heading"><h3>{L("Test a question", "प्रश्न की जाँच")}</h3><p>{L("A conclusion, its strongest support, its counterpoint, and the active timing link.", "निष्कर्ष, मुख्य सहारा, विरोधी संकेत और सक्रिय समय-संबंध।")}</p></div><div className="desk-topic-grid">{readings.map(topic => <article key={topic.key} data-balance={topic.result.synthesis.balance}><div><span>{topic.varga}</span><h4>{L(topic.title[0], topic.title[1])}</h4></div><BirthReliabilityBadge chart={chart} varga={topic.varga as "D9" | "D10" | "D2"} go={go} /><p>{topic.result.synthesis.conclusion}</p><dl><div><dt>{L("Supports", "सहारा")}</dt><dd>{topic.result.synthesis.support?.text ?? L("No direct support in these checks", "इन जाँचों में सीधा सहारा नहीं")}</dd></div><div><dt>{L("Challenges", "विरोध")}</dt><dd>{topic.result.synthesis.counterpoint?.text ?? L("No direct counterpoint in these checks", "इन जाँचों में सीधा विरोध नहीं")}</dd></div></dl><button type="button" onClick={() => go(topic.slug)}>{L("Open full analysis", "पूरा विश्लेषण खोलें")}</button></article>)}</div></section>
    <div className="desk-lower"><section className="desk-flags"><h3>{L("Condition flags", "स्थिति संकेत")}</h3><p>{L("These marks modify interpretation. They are not verdicts on their own.", "ये चिह्न व्याख्या को बदलते हैं; अकेले निर्णय नहीं हैं।")}</p><div>{flagged.length ? flagged.map(flag => <button key={`${flag.planet}-${flag.symbol}`} type="button" onClick={() => { a.update({ selected: { kind: "planet", planet: flag.planet } }); go("rasi"); }}><b>{flag.symbol}</b><span>{n(flag.planet)}<small>{flag.meaning}</small></span></button>) : <p>{L("No condition flags in the natal D1 checks.", "जन्म D1 जाँच में कोई स्थिति संकेत नहीं।")}</p>}</div></section><section className="desk-evidence"><h3>{L("Open questions in the chart", "कुंडली में खुले प्रश्न")}</h3><p>{L("Start with houses 1, 7 and 10; inspect the rule before accepting a claim.", "भाव 1, 7 और 10 से शुरू करें; दावा स्वीकारने से पहले नियम देखें।")}</p>{evidence.map(item => <div key={item.house}><h4>{L("House", "भाव")} {item.house} · {n(item.lord)}{item.mixed && <span>{L("mixed", "मिश्रित")}</span>}</h4>{item.items.filter(entry => entry.tone !== "context").slice(0, 2).map(entry => <EvidenceEntry key={entry.id} evidence={entry} go={go} />)}</div>)}</section></div>
    <nav className="desk-next" aria-label={L("Continue the investigation", "विश्लेषण जारी रखें")}>{[["calendar", L("Signal calendar", "संकेत कैलेंडर")], ["transits", L("Transit workbench", "गोचर कार्यक्षेत्र")], ["compare", L("Compare charts", "कुंडली तुलना")], ["journal", L("Event journal", "घटना विवरण")], ["calculations", L("Calculation audit", "गणना जाँच")]].map(([slug, label]) => <button type="button" key={slug} onClick={() => go(slug)}>{label}</button>)}</nav>
  </div>;
}
