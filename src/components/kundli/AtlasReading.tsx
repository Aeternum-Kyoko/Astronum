"use client";
import type { KundaliChart } from "@/lib/astrology/types";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { term } from "@/lib/i18n/terms";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { useAnalysis } from "./AnalysisContext";
import { ObservatoryCharts } from "./Observatory";
import "./atlas-reading.css";

export default function AtlasReading({chart,go}:{chart:KundaliChart;go:(slug:string)=>void}) {
  const locale=useLocale(); const hi=locale==="hi"; const a=useAnalysis()!;
  const moon=chart.planets.find(p=>p.planet==="Moon")!;
  const period=periodsAt(chart.dashas,a.at,1)[0];
  const facts=[
    {label:hi?"लग्न":"Rising sign",value:term(locale,chart.ascendant.sign),help:hi?"जन्म के समय पूर्व दिशा में उदित राशि।":"Lagna: the zodiac sign rising in the east at birth."},
    {label:hi?"चंद्र राशि":"Moon sign",value:term(locale,moon.sign),help:hi?"जन्म के समय चंद्रमा की राशि।":"The Moon’s zodiac sign at your birth."},
    {label:hi?"जन्म नक्षत्र":"Birth star",value:term(locale,moon.nakshatra),help:hi?"चंद्रमा के जन्म स्थान का नक्षत्र।":"Nakshatra: the lunar mansion occupied by your birth Moon."},
    {label:hi?"चुनी तिथि की दशा":"Selected-date period",value:period?term(locale,period.lord):"—",help:hi?"दशा: विंशोत्तरी पद्धति में ग्रह की समय अवधि।":"Dasha: a planetary period in the Vimshottari timing system."},
  ];
  return <div className="atlas-reading">
    <header className="atlas-reading-title"><div><span>{hi?"आपकी जन्म कुंडली":"Your birth chart"}</span><h2>{chart.input.name}</h2></div><p>{chart.input.date} · {chart.input.place.split(",")[0]}</p></header>
    <div className="atlas-insights">{facts.map(fact=><details key={fact.label}><summary><span>{fact.label}</span><strong>{fact.value}</strong><small>{hi?"अर्थ जानें":"What this means"} +</small></summary><p>{fact.help}</p></details>)}</div>
    <ObservatoryCharts chart={chart} go={go} mode="user" overview title={hi?"आपका जन्म आकाश":"Your sky at birth"}/>
    <div className="atlas-reading-next">{[{slug:"planets",label:hi?"ग्रहों को समझें":"Meet your planets",icon:"☉"},{slug:"dashas",label:hi?"अपनी दशाएँ देखें":"Explore your periods",icon:"◷"},{slug:"yogas",label:hi?"योगों को जानें":"Discover combinations",icon:"✧"}].map(item=><button key={item.slug} type="button" onClick={()=>go(item.slug)}><span aria-hidden="true">{item.icon}</span>{item.label}<span aria-hidden="true">↗</span></button>)}</div>
  </div>;
}
