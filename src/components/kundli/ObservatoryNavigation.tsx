"use client";
import { useState } from "react";
import { KUNDLI_SECTIONS } from "@/lib/kundliLibrary";
import { useAnalysis } from "./AnalysisContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

const groups=[
 {label:"Overview",hi:"अवलोकन",slug:"summary",slugs:["summary"]},
 {label:"Charts",hi:"कुंडलियाँ",slug:"rasi",slugs:["rasi","navamsa","vargas","compare"]},
 {label:"Dashas",hi:"दशाएँ",slug:"dashas",slugs:["dashas","yogini","chara","timeline"]},
 {label:"Transits",hi:"गोचर",slug:"transits",slugs:["transits","monthly","annual","calendar"]},
 {label:"Strength",hi:"बल",slug:"shadbala",slugs:["shadbala","ashtakavarga","lords"]},
 {label:"Life readings",hi:"जीवन व्याख्या",slug:"report",slugs:["report","planets","houses","career","relationships","wealth","education","property","sectors"]},
 {label:"Yogas & guidance",hi:"योग और मार्गदर्शन",slug:"yogas",slugs:["yogas","remedies","rudraksha","vastu"]},
 {label:"Birth details",hi:"जन्म विवरण",slug:"calculations",slugs:["calculations","precision","journal"]},
];
const navIcons=["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z","M12 2 22 12 12 22 2 12ZM2 12h20M12 2v20","M12 3v9l6 3M21 12a9 9 0 1 1-9-9","M3 12h18M15 6l6 6-6 6M3 5h6M3 19h6","M4 20V12M10 20V4M16 20V9M22 20V2","M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4ZM13 7a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3","m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z","M5 4h14v17H5ZM9 2v4M15 2v4M8 10h8M8 14h8M8 18h5"];
function SectionIcon({index}:{index:number}) {return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={navIcons[index]}/></svg>;}
export default function ObservatoryNavigation({mode,tab,go}:{mode:"user"|"astrologer";tab:string;go:(slug:string)=>void}) {
 const hi=useLocale()==="hi",[more,setMore]=useState(false),[query,setQuery]=useState("");
 const analysis=useAnalysis()!;
 const current=["D1 · Rasi Chart","D9 · Navamsa","More Vargas"].includes(tab)?analysis.primary==="D1"?"rasi":analysis.primary==="D9"?"navamsa":"vargas":tab==="Summary"?"summary":KUNDLI_SECTIONS.find(s=>s.tab===tab)?.slug;
 const active=groups.find(g=>g.slugs.includes(current??""));
 const visible=KUNDLI_SECTIONS.filter(s=>`${s.title} ${s.titleHi} ${s.description}`.toLowerCase().includes(query.toLowerCase()));
 return <div className="studio-navigation" id="kundli-sections"><div className="studio-navigation-main"><nav aria-label={hi?"कुंडली अनुभाग":"Kundli sections"}>{groups.map((g,index)=><button type="button" key={g.slug} aria-current={active===g?"page":undefined} onClick={()=>go(g.slug)}><SectionIcon index={index}/><span>{hi?g.hi:g.label}</span></button>)}</nav><button className="studio-all-tools" type="button" aria-expanded={more} onClick={()=>setMore(!more)}>{mode==="astrologer"?"Systems & tools":"All tools"} {more?"−":"+"}</button></div>{active&&active.slugs.length>1&&<nav className="studio-subnav" aria-label="Tools in this section">{active.slugs.map(slug=>KUNDLI_SECTIONS.find(s=>s.slug===slug)).filter(s=>!!s).map(s=><button key={s.slug} type="button" aria-current={current===s.slug?"page":undefined} onClick={()=>go(s.slug)}>{hi?s.titleHi:s.title}</button>)}</nav>}{more&&<section className="studio-tool-library"><header><h2>{hi?"पूरी कुंडली लाइब्रेरी":"Your complete Kundli library"}</h2><button type="button" onClick={()=>setMore(false)}>Close ×</button></header><input className="input" type="search" aria-label="Search Kundli tools" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search charts, KP, Lal Kitab, timing…"/><div>{visible.map(s=><button type="button" key={s.slug} onClick={()=>{go(s.slug);setMore(false);}}><strong>{hi?s.titleHi:s.title}</strong><span>{mode==="user"?(hi?s.descriptionHi:s.description):s.slug}</span></button>)}</div>{!visible.length&&<p>No matching tools.</p>}</section>}</div>;
}
