"use client";

import { useMemo, useState } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { natalMarkers } from "@/lib/astrology/chartMarkers";
import { topicReading, type TopicKey } from "@/lib/astrology/topicReading";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import KundliChart from "../KundliChart";
import EvidenceEntry from "../EvidenceEntry";
import { ChartStyleButtons } from "./ChartPicker";
import { useAnalysis } from "./AnalysisContext";
import ReadingObservations from "./ReadingObservations";
import BirthReliabilityBadge from "./BirthReliabilityBadge";

const AREAS: { key: TopicKey; label: [string, string]; varga: "D10" | "D9" | "D2" | "D24" | "D4" }[] = [
  { key: "career", label: ["Work", "काम"], varga: "D10" },
  { key: "relationships", label: ["Relationships", "संबंध"], varga: "D9" },
  { key: "wealth", label: ["Money", "धन"], varga: "D2" },
  { key: "education", label: ["Learning", "शिक्षा"], varga: "D24" },
  { key: "property", label: ["Home", "घर"], varga: "D4" },
];

export default function WorkspaceOverview({ chart, go }: { chart: KundaliChart; go: (slug: string) => void }) {
  const a = useAnalysis()!;
  const locale = useLocale();
  const L = pick(locale);
  const n = (value: string) => term(locale, value);
  const [chosenArea, setChosenArea] = useState<TopicKey | null>(null);
  const readings = useMemo(() => AREAS.map(area => ({ ...area, reading: topicReading(chart, area.key, a.at, locale, a.transits) })), [chart, a.at, a.transits, locale]);
  const firstActive = readings.find(item => item.reading.active.length > 0)?.key ?? "career";
  const selected = readings.find(item => item.key === (chosenArea ?? firstActive)) ?? readings[0];
  const synthesis = selected.reading.synthesis;
  const proof = selected.reading.evidence.flatMap(group => group.items).filter(item => synthesis.evidenceIds.includes(item.id));
  const running = periodsAt(chart.dashas, a.at, 3);
  const moon = chart.planets.find(planet => planet.planet === "Moon");
  const marks = useMemo(() => natalMarkers(chart), [chart]);
  return <div className="personal-overview">
    <header className="personal-reading-head">
      <div><p className="personal-reading-context">{L("YOUR CHART AT A GLANCE", "आपकी कुंडली एक नज़र में")}</p><h2>{n(chart.ascendant.sign)} {L("rising", "लग्न")}{moon ? ` · ${n(moon.sign)} ${L("Moon", "चंद्र")}` : ""}</h2><p>{moon ? `${L("Moon nakshatra", "चंद्र नक्षत्र")}: ${n(moon.nakshatra)}` : ""}</p></div>
      <div className="personal-running-period"><span>{L("At your selected date", "चुनी तिथि पर")}</span><strong>{running.map(period => n(period.lord)).join(" › ") || "—"}</strong><button type="button" onClick={() => go("dashas")}>{L("Explore the period", "दशा देखें")}</button></div>
    </header>
    <section className="personal-area-reading" aria-labelledby="personal-area-title">
      <div className="personal-area-head"><h3 id="personal-area-title">{L("Choose what matters to you", "अपना विषय चुनें")}</h3></div>
      <div className="personal-area-choices" role="group" aria-label={L("Choose a life area", "जीवन विषय चुनें")}>{readings.map(item => <button type="button" key={item.key} aria-pressed={selected.key === item.key} onClick={() => setChosenArea(item.key)}>{L(...item.label)}</button>)}</div>
      <article className="personal-area-result" key={selected.key}>
        <div className="personal-area-result-title"><div><span>{L(...selected.label)}</span><h4>{selected.reading.title}</h4></div><BirthReliabilityBadge chart={chart} varga={selected.varga} go={go} /></div>
        <p className="personal-area-lead">{synthesis.conclusion}</p>
        <div className="personal-reading-factors"><div><b>{L("What supports it", "क्या सहारा देता है")}</b><p>{synthesis.support?.text ?? L("No clear support in these checks.", "इन जाँचों में स्पष्ट सहारा नहीं मिला।")}</p></div><div><b>{L("What complicates it", "क्या कठिन बनाता है")}</b><p>{synthesis.counterpoint?.text ?? L("No clear counterpoint in these checks.", "इन जाँचों में स्पष्ट विरोध नहीं मिला।")}</p></div></div>
        <div className="personal-reading-timing"><b>{L("Why this period matters", "यह अवधि क्यों महत्वपूर्ण है")}</b><p>{synthesis.timing.text}</p></div>
        <div className="personal-area-actions"><button type="button" onClick={() => go(selected.key)}>{L("Read the full analysis", "पूरा विश्लेषण पढ़ें")}</button><button type="button" onClick={() => go("transits")}>{L("See transits on this date", "इस तिथि के गोचर देखें")}</button></div>
        <details className="personal-reading-proof"><summary>{L("See the chart evidence", "कुंडली प्रमाण देखें")}</summary><div>{proof.map(item => <EvidenceEntry key={item.id} evidence={item} go={go} />)}{proof.length === 0 && <p>{L("These checks do not establish a clear direction. Open the full analysis for placements and limits.", "इन जाँचों से स्पष्ट दिशा नहीं मिलती। स्थितियाँ और सीमाएँ देखने के लिए पूरा विश्लेषण खोलें।")}</p>}</div></details>
      </article>
    </section>
    <section className="personal-chart-reference" aria-label={L("Birth charts", "जन्म कुंडलियाँ")}>
      <div className="personal-chart-heading"><div><h3>{L("The charts behind your reading", "व्याख्या के पीछे की कुंडलियाँ")}</h3><p>{L("D1 is the foundation. D9 adds detail when the birth time is reliable.", "D1 मुख्य आधार है। जन्म-समय भरोसेमंद हो तो D9 और विवरण देती है।")}</p></div><ChartStyleButtons value={a.style} onChange={style => a.update({ style })} /></div>
      <div className="personal-chart-pair">{(["D1", "D9"] as const).map(key => <article key={key}><header><span>{key}</span><div><h4>{key === "D1" ? L("Birth chart", "जन्म कुंडली") : L("Navamsa", "नवांश")}</h4><p>{key === "D1" ? L("Planet and house positions", "ग्रह और भाव स्थितियाँ") : L("Read alongside D1", "D1 के साथ देखें")}</p></div></header>{key === "D9" && <BirthReliabilityBadge chart={chart} varga="D9" go={go} />}<KundliChart style={a.style} ascendantSignIndex={chart.divisionalCharts[key].ascendant.signIndex} planets={key === "D1" ? chart.planets.map(planet => ({ ...planet, markers: marks[planet.planet] })) : chart.divisionalCharts[key].planets} selected={a.selected} onPick={value => a.update({ selected: value })} ariaLabel={`${key} ${L("birth chart", "जन्म कुंडली")}`} /><button type="button" onClick={() => go(key === "D1" ? "rasi" : "navamsa")}>{L("Open chart details", "कुंडली विवरण देखें")}</button></article>)}</div>
      <div className="personal-more-paths"><button type="button" onClick={() => go("shadbala")}>{L("Planet strength", "ग्रह बल")}</button><button type="button" onClick={() => go("report")}>{L("Full life report", "पूरा जीवन विवरण")}</button><button type="button" onClick={() => go("precision")}>{L("Birth-time precision", "जन्म-समय सटीकता")}</button></div>
    </section>
    <details className="personal-journal-disclosure" id="overview-journal"><summary>{L("Record what happened on this date", "इस तिथि पर क्या हुआ, लिखें")}</summary><ReadingObservations chart={chart} /></details>
  </div>;
}
