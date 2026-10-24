"use client";
import { useState } from "react";
import { KUNDLI_SECTIONS } from "@/lib/kundliLibrary";
import { useLocale } from "@/lib/i18n/LocaleContext";

type Props={mode:"user"|"astrologer";tab:string;go:(slug:string)=>void};
const groups=[
  {name:"Birth charts",hi:"कुंडलियाँ",slug:"rasi",slugs:["rasi","navamsa","vargas","compare","precision"]},
  {name:"Periods & transits",hi:"समय",slug:"dashas",slugs:["dashas","transits","monthly","annual","timeline","calendar","yogini","chara"]},
  {name:"Life readings",hi:"व्याख्या",slug:"report",slugs:["report","planets","houses","career","relationships","wealth","education","property","sectors"]},
  {name:"Strength & scores",hi:"बल",slug:"shadbala",slugs:["shadbala","ashtakavarga","lords"],expert:true},
  {name:"Remedies & practice",hi:"मार्गदर्शन",slug:"remedies",slugs:["yogas","remedies","rudraksha","vastu"]},
  {name:"Specialist systems",hi:"पद्धतियाँ",slug:"kp",slugs:["kp","lalkitab","tables"],expert:true},
  {name:"Birth data & notes",hi:"अध्ययन विवरण",slug:"journal",slugs:["journal","calculations"],expert:true},
];
export default function ObservatoryNavigation({mode,tab,go}:Props) {
  const hi=useLocale()==="hi"; const [open,setOpen]=useState(false);const [query,setQuery]=useState("");const [filter,setFilter]=useState("All");
  const current=KUNDLI_SECTIONS.find(s=>s.tab===tab);const active=groups.find(g=>g.slugs.includes(current?.slug??""));
  const visible=KUNDLI_SECTIONS.filter(s=>(filter==="All"||groups.find(g=>g.name===filter)?.slugs.includes(s.slug))&&`${s.title} ${s.titleHi} ${s.description} ${s.slug}`.toLowerCase().includes(query.toLowerCase()));
  const choose=(slug:string)=>{setOpen(false);setQuery("");setFilter("All");go(slug);};
  return <><div className="obs-navigation" id="kundli-sections"><nav aria-label={hi?"कुंडली कार्यक्षेत्र":"Kundli workspace"}><button type="button" aria-current={tab==="Summary"?"page":undefined} onClick={()=>choose("summary")}>{hi?"अवलोकन":"Overview"}</button>{groups.filter(g=>mode==="astrologer"||!g.expert).map(g=><button type="button" key={g.name} aria-current={active===g?"page":undefined} onClick={()=>choose(g.slug)}>{hi?g.hi:g.name}</button>)}</nav><button type="button" className="obs-library-trigger" aria-expanded={open} onClick={()=>setOpen(!open)}>{hi?"सभी 34 अनुभाग":"All 34 tools"} {open?"−":"+"}</button></div>{open?<section className="obs-library"><header><div><h2>{hi?"अपना अगला अध्ययन चुनें":"Choose your next investigation"}</h2><p>{hi?"कुंडलियाँ, व्याख्या, समय और विशेषज्ञ गणना।":"Charts, readings, timing and specialist calculations in one searchable library."}</p></div><button type="button" onClick={()=>setOpen(false)}>{hi?"बंद करें":"Close"}</button></header><input type="search" aria-label={hi?"कुंडली उपकरण खोजें":"Search Kundli tools"} placeholder={hi?"ग्रह, दशा या पद्धति खोजें…":"Find a chart, period or method…"} value={query} onChange={e=>setQuery(e.target.value)}/><div className="obs-library-filters" role="group" aria-label={hi?"उपकरण का विषय":"Filter tools by topic"}><button type="button" aria-pressed={filter==="All"} onClick={()=>setFilter("All")}>{hi?"सभी":"All tools"} · 34</button>{groups.map(g=><button type="button" key={g.name} aria-pressed={filter===g.name} onClick={()=>setFilter(g.name)}>{hi?g.hi:g.name} · {g.slugs.length}</button>)}</div><p className="obs-library-count" role="status">{visible.length} {hi?"अनुभाग मिले":"sections found"}</p><div className="obs-library-results">{visible.map(s=><button type="button" key={s.slug} onClick={()=>choose(s.slug)}><strong>{hi?s.titleHi:s.title}</strong><span>{hi?s.descriptionHi:s.description}</span><small>{s.personal?(hi?"व्यक्तिगत और ज्योतिषी":"Personal & Astrologer"):(hi?"विशेषज्ञ":"Specialist")}</small></button>)}</div>{!visible.length&&<p role="status">{hi?"कोई उपकरण नहीं मिला।":"No matching tools. Try another term."}</p>}</section>:active&&<nav className="obs-subnav" aria-label={hi?"इस अनुभाग के उपकरण":"Tools in this section"}>{active.slugs.map(slug=>KUNDLI_SECTIONS.find(s=>s.slug===slug)!).filter(s=>mode==="astrologer"||s.personal||s===current).map(s=><button key={s.slug} type="button" aria-current={s===current?"page":undefined} onClick={()=>choose(s.slug)}>{hi?s.titleHi:s.title}</button>)}</nav>}</>;
}
