"use client";

import { useState, type ReactNode } from "react";
import type { KundaliChart } from "@/lib/astrology/types";
import { houseSignification, planetKeynote, signKeynote } from "@/lib/astrology/content";
import { SIGNS, SIGN_LORDS } from "@/lib/astrology/constants";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { skyDegreeText } from "@/lib/skyDial";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";
import KundliChart from "../KundliChart";
import { ChartStyleButtons } from "./ChartPicker";
import { useAnalysis } from "./AnalysisContext";
import BirthReliabilityBadge from "./BirthReliabilityBadge";
import { KundliShelves } from "./KundliLibrary";

export default function KundliStart({ chart, mode, go, numbers }: { chart:KundaliChart; mode:"user"|"astrologer"; go:(slug:string)=>void; numbers:ReactNode }) {
  const a = useAnalysis()!; const locale = useLocale(); const hi = locale === "hi"; const n = (text:string) => term(locale,text);
  const [varga,setVarga] = useState<"D1"|"D9"|"D10">("D1");
  const division = chart.divisionalCharts[varga];
  const moon = chart.planets.find(p => p.planet === "Moon")!;
  const selectedPlanet = a.selected?.kind === "planet" ? a.selected.planet : "Moon";
  const selected = chart.planets.find(p => p.planet === selectedPlanet) ?? moon;
  const house = a.selected?.kind === "house" ? a.selected.house : null;
  const houseSign = house ? (division.ascendant.signIndex + house - 1) % 12 : null;
  const displayed = (varga === "D1" ? chart.planets : division.planets).find(p => p.planet === selected.planet)!;
  const running = periodsAt(chart.dashas,a.at,3);
  return <div className="rebuilt-start">
    <header className="rebuilt-introduction"><span>{hi ? mode === "user" ? "आपकी कुंडली, सरल व्याख्या" : "ज्योतिषी कार्यक्षेत्र" : mode === "user" ? "Your chart. Your understanding." : "The astrologer's casebook"}</span><h2>{hi ? mode === "user" ? "अपने जन्म आकाश को समझें।" : "स्थिति से गणना तक।" : mode === "user" ? "Meet your birth chart." : "From placements to evidence."}</h2><p>{hi ? mode === "user" ? "कुंडली से शुरू करें। ग्रह चुनें, उसका अर्थ समझें और फिर अपनी रुचि का विषय खोलें।" : "ग्रह स्थिति, बल, दशा और विशेष पद्धतियों को एक क्रम में देखें।" : mode === "user" ? "Start with the chart. Select a planet, understand its meaning, then explore the chapters that matter to you." : "Inspect positions first, then investigate strengths, timing, divisional charts and specialist systems."}</p></header>
    <div className="rebuilt-birth-facts"><span>{hi ? "लग्न" : "Lagna"}<strong>{n(chart.ascendant.sign)} {skyDegreeText(chart.ascendant.siderealLongitude)}</strong></span><span>{hi ? "चंद्र राशि" : "Moon sign"}<strong>{n(moon.sign)}</strong></span><span>{hi ? "जन्म नक्षत्र" : "Birth star"}<strong>{n(moon.nakshatra)} · {hi ? "पद" : "Pada"} {moon.pada}</strong></span></div>
    <section className="rebuilt-feature-chart" aria-label={hi ? "मुख्य कुंडली" : "Featured chart"}><div className="rebuilt-chart-controls"><div role="group" aria-label={hi ? "कुंडली चुनें" : "Choose overview chart"}>{(["D1","D9","D10"] as const).map(key => <button type="button" key={key} aria-pressed={varga === key} onClick={() => setVarga(key)}>{key}<span>{key === "D1" ? hi ? "जन्म" : "Birth" : key === "D9" ? hi ? "नवांश" : "Navamsa" : hi ? "करियर" : "Career"}</span></button>)}</div><ChartStyleButtons value={a.style} onChange={style => a.update({style})} /></div>
      {varga !== "D1" && <BirthReliabilityBadge chart={chart} varga={varga} go={go} />}
      <div className="rebuilt-chart-art"><KundliChart style={a.style} ascendantSignIndex={division.ascendant.signIndex} planets={varga === "D1" ? chart.planets : division.planets} selected={a.selected} onPick={selected => a.update({selected})} ariaLabel={`${varga} ${hi ? "कुंडली" : "chart"}`} /></div>
      <div className="rebuilt-planet-picker" role="group" aria-label={hi ? "ग्रह का अर्थ देखें" : "Explore a planet"}>{(varga === "D1" ? chart.planets : division.planets).map(p => <button type="button" key={p.planet} aria-pressed={!house && selected.planet === p.planet} onClick={() => a.update({selected:{kind:"planet",planet:p.planet}})}><strong>{n(p.planet)}</strong><span>{n(p.sign)}{mode === "astrologer" && varga === "D1" ? ` ${skyDegreeText(chart.planets.find(natal => natal.planet === p.planet)!.siderealLongitude)}` : ""}</span></button>)}</div>
      <p className="rebuilt-chart-hint">{hi ? "ग्रह चुनकर नीचे उसका अर्थ देखें। विस्तृत भाव विश्लेषण कुंडली अनुभाग में है।" : "Select a planet to read its meaning below. Open the chart section for detailed house analysis."}</p>
    </section>
    <section className="rebuilt-planet-story" aria-live="polite"><span>{varga} · {hi ? "चयन की व्याख्या" : "Understanding your selection"}</span>{house && houseSign !== null ? <><h3>{hi ? "भाव" : "House"} {house} · {n(SIGNS[houseSign])}</h3><p>{houseSignification(house,locale)}</p><p>{hi ? `इस राशि के स्वामी ${n(SIGN_LORDS[houseSign])} हैं। पूरे निष्कर्ष के लिए स्थिति, दृष्टि और बल साथ देखें।` : `${SIGN_LORDS[houseSign]} rules this sign. Read its placement, aspects and strength together before drawing a conclusion.`}</p></> : <><h3>{n(selected.planet)} {hi ? "राशि" : "in"} {n(displayed.sign)}</h3><p>{hi ? `${n(selected.planet)} के पारंपरिक कारक: ${planetKeynote(selected.planet,locale)}।` : `In traditional Jyotish, ${selected.planet} signifies ${planetKeynote(selected.planet,locale)}.`}</p><p>{hi ? `${n(displayed.sign)} का स्वभाव ${signKeynote(displayed.sign,locale)} है। यह अकेली स्थिति पूरी व्याख्या नहीं है।` : `${displayed.sign} is traditionally described as ${signKeynote(displayed.sign,locale)}. This placement is one part of the complete reading.`}</p></>}<button type="button" onClick={() => go(varga === "D1" ? "rasi" : varga === "D9" ? "navamsa" : "vargas")}>{hi ? "कुंडली की पूरी व्याख्या देखें" : "Explore the full chart reading"}</button></section>
    <section className="rebuilt-current-period"><div><span>{hi ? "चुनी हुई तिथि पर दशा" : "Planetary periods at the selected date"}</span><strong>{running.map(p => n(p.lord)).join(" › ") || "—"}</strong><small>{a.date} · {a.time} · {a.zone}</small></div><button type="button" onClick={() => go("dashas")}>{hi ? "दशाएँ खोलें" : "Explore Dashas"}</button></section>
    {mode === "astrologer" && <section className="rebuilt-numeric-overview"><div className="rebuilt-row-heading"><div><h3>{hi ? "जन्म ग्रह स्थिति" : "Natal position ledger"}</h3><p>{hi ? "निरयन अंश, नक्षत्र, भाव और ग्रह स्थिति।" : "Sidereal positions, nakshatras, houses and planetary condition."}</p></div><button type="button" onClick={() => go("calculations")}>{hi ? "गणना विवरण" : "Calculation details"}</button></div><div className="rebuilt-table-scroll">{numbers}</div></section>}
    <KundliShelves mode={mode} go={go} />
  </div>;
}
