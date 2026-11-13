"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ToolIcon from "@/components/icons/ToolIcon";
import LiveTransits from "@/components/LiveTransits";
import { promptInstall, useInstallState } from "@/components/AppChrome";
import { listCharts, type StoredChart } from "@/lib/offlineCharts";
import { toBirthQuery } from "@/lib/birthParams";
import { SIGNS, SIGN_GLYPHS, NAKSHATRAS } from "@/lib/astrology/constants";
import { tithiIndex, tithiName } from "@/lib/astrology/birthDetails";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";
import type { SkyPosition } from "@/lib/skyDial";
import "./mobile-home.css";

const tools = [
  {href:"/kundali",name:"Free Kundli",hi:"जन्म कुंडली",icon:"kundli",group:"charts",color:"gold"},
  {href:"/matching",name:"Matching",hi:"कुंडली मिलान",icon:"matching",group:"charts",color:"rose"},
  {href:"/horoscope",name:"Horoscope",hi:"राशिफल",icon:"horoscope",group:"daily",color:"violet"},
  {href:"/panchang",name:"Panchang",hi:"पंचांग",icon:"panchang",group:"daily",color:"blue"},
  {href:"/numerology",name:"Numerology",hi:"अंक ज्योतिष",icon:"numerology",group:"charts",color:"blue"},
  {href:"/sade-sati",name:"Sade Sati",hi:"साढ़े साती",icon:"sadeSati",group:"charts",color:"violet"},
  {href:"/muhurat",name:"Muhurat",hi:"शुभ मुहूर्त",icon:"muhurat",group:"daily",color:"gold"},
  {href:"/festivals",name:"Festivals",hi:"व्रत-त्योहार",icon:"festivals",group:"daily",color:"rose"},
  {href:"/palmistry",name:"Palm reading",hi:"हस्तरेखा",icon:"palmistry",group:"charts",color:"rose"},
  {href:"/vastu",name:"Vastu",hi:"वास्तु",icon:"vastu",group:"charts",color:"blue"},
  {href:"/learn",name:"Learn Jyotish",hi:"ज्योतिष सीखें",icon:"kundli",group:"learn",color:"violet"},
  {href:"/research",name:"Chart research",hi:"कुंडली शोध",icon:"rectification",group:"learn",color:"gold"},
];

export default function MobileHome({ locale, positions, at }: {locale:Locale;positions:SkyPosition[];at:string}) {
  const hi=locale==="hi", href=(path:string)=>localizeHref(locale,path);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [charts,setCharts]=useState<StoredChart[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [transits,setTransits]=useState(false);
  const install=useInstallState();
  useEffect(()=>{let active=true; void listCharts().then(items=>{if(active){setCharts(items.slice(0,3));setLoaded(true);}});return()=>{active=false;};},[]);
  const moon=positions.find(p=>p.planet==="Moon")!,sun=positions.find(p=>p.planet==="Sun")!;
  const lunar=tithiName(tithiIndex(sun.longitude,moon.longitude));
  const filtered=tools.filter(t=>(category==="all"||t.group===category)&&`${t.name} ${t.hi}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className="mobile-home">
    <div className="mh-welcome"><div><p>{new Date(at).toLocaleDateString(hi?"hi-IN":"en-IN",{weekday:"long",day:"numeric",month:"long",timeZone:"Asia/Kolkata"})}</p><h1>{hi?"आपका अपना आकाश।":"Your sky, made personal."}</h1></div><Link href={hi?"/":"/hi"} className="mh-language" aria-label={hi?"Switch to English":"हिंदी में पढ़ें"}>{hi?"English":"हिंदी"}</Link></div>
    <section className="mh-kundli" aria-labelledby="mh-kundli-title"><div><span>{hi?"जन्म कुंडली":"Your birth chart"}</span><h2 id="mh-kundli-title">{hi?"खुद को नए नज़रिए से देखें।":"A closer look at you."}</h2><p>{hi?"ग्रह, भाव और दशाएं। सरल व्याख्या के साथ।":"Planets, houses and dashas. Clearly explained."}</p><Link href={href("/kundali")}>{hi?"निःशुल्क कुंडली बनाएं":"Create free Kundli"}<span aria-hidden="true">↗</span></Link></div><div className="mh-earth" aria-hidden="true"><div className="mh-earth-sphere"/><span className="mh-earth-moon"/></div></section>
    <nav className="mh-personal" aria-label={hi?"व्यक्तिगत उपकरण":"Your shortcuts"}><Link href="/account"><ToolIcon name="kundli"/>{hi?"मेरी कुंडलियाँ":"My charts"}</Link><Link href="/horoscope/personal"><ToolIcon name="personal"/>{hi?"मेरा राशिफल":"My horoscope"}</Link><Link href="/consultation"><ToolIcon name="matching"/>{hi?"परामर्श":"Consultation"}</Link></nav>
    <section className="mh-tools" aria-labelledby="mh-tools-title"><div className="mh-heading"><h2 id="mh-tools-title">{hi?"आप कहाँ से शुरू करेंगे?":"Where will you begin?"}</h2><span>{hi?"आपके उपकरण":"Your toolkit"}</span></div><label className="mh-search"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5"/></svg><span className="sr-only">{hi?"ज्योतिष उपकरण खोजें":"Search astrology tools"}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={hi?"कुंडली, मिलान, पंचांग खोजें…":"Search Kundli, matching, Panchang…"}/></label><div className="mh-categories" role="group" aria-label={hi?"उपकरण श्रेणी":"Tool category"}>{[["all","All tools","सभी"],["charts","Charts","कुंडली"],["daily","Daily","दैनिक"],["learn","Learn","सीखें"]].map(([id,en,hin])=><button key={id} type="button" aria-pressed={category===id} onClick={()=>setCategory(id)}>{hi?hin:en}</button>)}</div><div className="mh-tool-grid">{filtered.map(t=><Link href={href(t.href)} key={t.href}><span className={`mh-tool-icon mh-${t.color}`}><ToolIcon name={t.icon}/></span><strong>{hi?t.hi:t.name}</strong></Link>)}</div>{!filtered.length&&<p className="mh-empty" role="status">{hi?"कोई उपकरण नहीं मिला। दूसरा नाम आज़माएं।":"No matching tools. Try another name or category."}</p>}</section>
    <section className="mh-sky" aria-labelledby="mh-sky-title"><div className="mh-heading"><h2 id="mh-sky-title">{hi?"आज का आकाश":"Today’s sky"}</h2><time dateTime={at}>{new Date(at).toLocaleDateString(hi?"hi-IN":"en-IN",{day:"numeric",month:"short",timeZone:"Asia/Kolkata"})} IST</time></div><div className="mh-sky-facts"><div><span>{hi?"चंद्र राशि":"Moon sign"}</span><strong>{term(locale,SIGNS[Math.floor(moon.longitude/30)])}</strong></div><div><span>{hi?"नक्षत्र":"Nakshatra"}</span><strong>{term(locale,NAKSHATRAS[Math.floor(moon.longitude/(360/27))])}</strong></div><div><span>{hi?"तिथि":"Lunar day"}</span><strong>{term(locale,`${lunar.paksha} ${lunar.tithi}`)}</strong></div></div><p className="mh-snapshot-note">{hi?"गणना का समय":"Calculated"} {new Date(at).toLocaleTimeString(hi?"hi-IN":"en-IN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"})} IST</p><div className="mh-sky-actions"><Link href={href("/panchang")}>{hi?"पूरा पंचांग":"Full Panchang"} ↗</Link><button type="button" aria-expanded={transits} aria-controls="mh-transits" onClick={()=>setTransits(!transits)}>{transits?(hi?"गोचर बंद करें":"Hide transits"):(hi?"ग्रह अंश देखें":"Planet degrees")} {transits?"−":"+"}</button></div></section>
    {transits&&<div id="mh-transits" className="mh-transits"><LiveTransits positions={positions} at={at} locale={locale}/></div>}
    <section className="mh-signs" aria-labelledby="mh-signs-title"><div className="mh-heading"><h2 id="mh-signs-title">{hi?"अपना राशिफल पढ़ें":"Your daily horoscope"}</h2></div><div className="mh-sign-list">{SIGNS.map((sign,i)=><Link key={sign} href={href(`/horoscope/${sign.toLowerCase()}`)}><span aria-hidden="true">{SIGN_GLYPHS[i]}</span>{term(locale,sign)}</Link>)}</div></section>
    <section className="mh-recent" aria-labelledby="mh-recent-title"><div className="mh-heading"><h2 id="mh-recent-title">{hi?"हाल की कुंडलियाँ":"Pick up where you left off"}</h2><Link href="/account">{hi?"सभी देखें":"View all"}</Link></div>{!loaded?<p className="mh-empty">{hi?"कुंडलियाँ लोड हो रही हैं…":"Loading your charts…"}</p>:charts.length?charts.map(c=><Link className="mh-recent-chart" key={c.key} href={`${href("/kundali")}?${toBirthQuery(c.input)}`}><ToolIcon name="kundli"/><span><strong>{c.input.name}</strong><small>{c.input.date} · {c.input.place}</small></span><span aria-hidden="true">↗</span></Link>):<div className="mh-empty"><ToolIcon name="kundli"/><p>{hi?"यहाँ खोली गई कुंडलियाँ इस डिवाइस पर दिखेंगी।":"Charts you open on this device will appear here."}</p><Link href={href("/kundali")}>{hi?"पहली कुंडली बनाएं":"Create your first chart"} ↗</Link></div>}</section>
    {(install==="prompt"||install==="ios")&&<section className="mh-install"><ToolIcon name="personal"/><div><h2>{hi?"Astronum साथ रखें":"Keep Astronum close"}</h2>{install==="ios"?<p>{hi?"Safari में शेयर खोलें, फिर ‘होम स्क्रीन पर जोड़ें’ चुनें।":"In Safari, open Share, then choose Add to Home Screen."}</p>:<button type="button" onClick={()=>void promptInstall()}>{hi?"होम स्क्रीन पर जोड़ें":"Add to home screen"} ↗</button>}</div></section>}
    <p className="mh-footnote">{hi?"वैदिक परंपरा, खगोलीय गणना और स्पष्ट व्याख्या।":"Vedic tradition. Astronomical calculations. Clear explanations."}</p>
  </div>;
}
