"use client";
import { useId, useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { KundaliChart } from "@/lib/astrology/types";
import { topicReading, TOPICS, type TopicKey } from "@/lib/astrology/topicReading";
import { inspectChart, chartRelationships, type InspectionPick } from "@/lib/astrology/chartInspection";
import type { ReadingEvidence } from "@/lib/astrology/readingEvidence";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";
import { useAnalysis } from "./AnalysisContext";
import { useDeviceStore } from "@/lib/useDeviceStore";
import ChartSelectionReading from "./ChartSelectionReading";
import KundliChart from "../KundliChart";
import { ChartStyleButtons } from "./ChartPicker";
import { TransitClock, ObservatoryCharts } from "./Observatory";

type Props={chart:KundaliChart;mode:"user"|"astrologer";go:(slug:string)=>void};
export function TopicChapter({chart,mode,go,topic}:Props&{topic:TopicKey}) {
  const a=useAnalysis()!;const locale=useLocale();const hi=locale==="hi";
  const r=useMemo(()=>topicReading(chart,topic,a.at,locale,a.transits),[chart,topic,a.at,locale,a.transits]);
  const openEvidence=(e:ReadingEvidence)=>{go(e.destination.chart==="D1"?"rasi":e.destination.chart==="D9"?"navamsa":"vargas");a.update({primary:e.destination.chart,selected:e.destination.pick,reference:"lagna"});};
  return <article className="obs-topic"><header className="obs-topic-answer"><span>{r.title}</span><h2>{r.summary}</h2><p>{r.synthesis.timing.text}</p><div><button type="button" onClick={()=>{a.update({primary:"D1",secondary:TOPICS[topic].vargas[0]});go("compare");}}>{hi?"संबंधित कुंडलियाँ साथ देखें":"Compare the relevant charts"} · D1 + {TOPICS[topic].vargas[0]}</button><button type="button" onClick={()=>go("dashas")}>{hi?"दशा में देखें":"Explore the timing"}</button></div></header>
    <details className="obs-reading-chart" open><summary>{hi?"कुंडली का दृश्य आधार":"Chart evidence"} · D1 + {TOPICS[topic].vargas[0]}</summary><ObservatoryCharts chart={chart} go={go} mode={mode} pair={["D1",TOPICS[topic].vargas[0]]} title={`${r.title} · D1 + ${TOPICS[topic].vargas[0]}`}/></details>
    <div className="obs-topic-signals">{[{title:hi?"मुख्य सहारा":"What supports this area",tone:"support",items:r.supportEvidence},{title:hi?"जहाँ ध्यान चाहिए":"What needs attention",tone:"pressure",items:r.pressureEvidence}].map(group=><section key={group.tone} data-tone={group.tone}><h3>{group.title}</h3>{group.items.length?group.items.slice(0,mode==="user"?3:group.items.length).map(e=><details key={e.id}><summary>{e.statement}</summary><p>{e.observation}</p><p>{e.rule}</p><small>{e.limitation}</small><button type="button" onClick={()=>openEvidence(e)}>{hi?"कुंडली में जाँचें":"Inspect in the chart"}</button></details>):<p>{hi?"इन जाँचों में कोई सीधा संकेत नहीं।":"No direct factors flagged by these checks."}</p>}</section>)}</div>
    <section className="obs-topic-planets"><header className="obs-section-heading"><h2>{hi?"इस विषय के मुख्य ग्रह":"The planets behind this reading"}</h2></header><div>{r.karakas.map(k=><article key={k.planet}><h3>{term(locale,k.planet)}</h3><p>{term(locale,k.placement.sign)} · {hi?"भाव":"House"} {k.placement.house} · {k.placement.degreeInSign.toFixed(2)}°</p><span>{term(locale,k.placement.nakshatra)} · {hi?"पद":"Pada"} {k.placement.pada}</span>{k.strength&&<p>{hi?"बल":"Strength"}: {k.strength.rupas.toFixed(2)} / {k.strength.requiredRupas} Rupas</p>}<div>{k.vargas.map(v=><small key={v.key}>{v.key}: {term(locale,v.placement.sign)} · {hi?"भाव":"House"} {v.placement.house}</small>)}</div></article>)}</div></section>
    <section className="obs-topic-periods"><h2>{hi?"संबंधित अगली अवधियाँ":"Related periods ahead"}</h2>{r.periods.length?r.periods.map(p=><div key={`${p.maha}:${p.start}`}><strong>{term(locale,p.maha)} › {term(locale,p.lord)}</strong><span>{DateTime.fromJSDate(new Date(p.start)).setZone(a.zone).toFormat("dd LLL yyyy")} — {DateTime.fromJSDate(new Date(p.end)).setZone(a.zone).toFormat("dd LLL yyyy")}</span></div>):<p>{hi?"उपलब्ध अवधि में कोई सीधी सक्रियता नहीं।":"No direct activations within the available coverage."}</p>}<small>{hi?"ये सक्रियता की अवधियाँ हैं, घटना की निश्चित तिथियाँ नहीं।":"These are activation windows, rather than promised event dates."}</small></section>
    {!!r.yogas.length&&<section className="obs-topic-yogas"><h2>{hi?"संबंधित योग":"Related combinations"}</h2>{r.yogas.map(y=><details key={y.id}><summary>{y.name}</summary><p>{y.formation}</p><p>{y.effect}</p></details>)}</section>}
  </article>;
}

export function ReadingAtlas({chart,mode,go}:Props) {
  const a=useAnalysis()!;const locale=useLocale();const hi=locale==="hi";
  const chapters=useMemo(()=>Object.keys(TOPICS).map(topic=>({topic:topic as TopicKey,r:topicReading(chart,topic as TopicKey,a.at,locale,a.transits)})),[chart,a.at,locale,a.transits]);
  return <div className="obs-atlas"><TransitClock context="reading"/><header className="obs-section-heading"><div><h2>{hi?"जीवन के मुख्य अध्याय":"The main chapters of your chart"}</h2><p>{hi?"हर निष्कर्ष का आधार खोलकर देखें।":"Each answer leads to its placements, aspects and timing evidence."}</p></div></header>{chapters.map(({topic,r})=><article key={topic} data-balance={r.synthesis.balance}><div><span>{r.title}</span><h3>{r.summary}</h3><p>{r.synthesis.timing.text}</p></div><button type="button" onClick={()=>go(topic)}>{mode==="astrologer"?(hi?"प्रमाण जाँचें":"Inspect the evidence"):(hi?"अपना अध्याय खोलें":"Read your chapter")}</button></article>)}</div>;
}

export function PlacementReader({chart,mode,kind}:Props&{kind:"planets"|"houses"}) {
  const a=useAnalysis()!;const locale=useLocale();const hi=locale==="hi";
  const [analysisVisible,setAnalysisVisible]=useState(true);
  const [showAspects,setShowAspects]=useDeviceStore<boolean>("kundli-show-aspects",false);
  const readingId=useId();
  const [fallback,setFallback]=useState<InspectionPick>(kind==="planets"?{kind:"planet",planet:"Moon"}:{kind:"house",house:1});
  const selected=a.selected?.kind===(kind==="planets"?"planet":"house")?a.selected as InspectionPick:fallback;
  const d=inspectChart(chart,"D1",selected,a.at);
  const select=(pick:InspectionPick)=>{
    const same=pick.kind===selected.kind&&(pick.kind==="planet"?selected.kind==="planet"&&selected.planet===pick.planet:selected.kind==="house"&&selected.house===pick.house);
    if(same&&analysisVisible){setAnalysisVisible(false);a.update({selected:null});return;}
    setAnalysisVisible(true);setFallback(pick);a.update({selected:pick});
  };
  return <div className="obs-placement-reader"><div className="obs-placement-picks" role="group" aria-label={hi?"पढ़ने के लिए चुनें":"Choose a reading"}>{kind==="planets"?chart.planets.map(p=><button type="button" key={p.planet} aria-pressed={analysisVisible&&selected.kind==="planet"&&selected.planet===p.planet} onClick={()=>select({kind:"planet",planet:p.planet})}>{term(locale,p.planet)}<small>{term(locale,p.sign)}</small></button>):chart.houseLords.map(h=><button type="button" key={h.house} aria-pressed={analysisVisible&&selected.kind==="house"&&selected.house===h.house} onClick={()=>select({kind:"house",house:h.house})}>{hi?"भाव":"House"} {h.house}<small>{term(locale,h.sign)}</small></button>)}</div><section className="obs-reader-chart"><header><h2>{hi?"जन्म कुंडली में देखें":"Follow the reading in D1"}</h2><div className="obs-deck-actions"><button type="button" className="obs-aspect-toggle" aria-pressed={showAspects} onClick={()=>setShowAspects(!showAspects)}>{hi?"दृष्टि रेखाएँ":"Show aspects"}<span>{showAspects?"On":"Off"}</span></button><ChartStyleButtons value={a.style} onChange={style=>a.update({style})}/></div></header><KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} style={a.style} selected={analysisVisible?selected:null} relationships={analysisVisible&&showAspects?chartRelationships(d):null} onPick={pick=>select(pick as InspectionPick)} /></section>{analysisVisible&&<ChartSelectionReading chart={chart} lens="D1" pick={selected} mode={mode} id={readingId} onClose={()=>{setAnalysisVisible(false);a.update({selected:null});}}/>}</div>;
}
