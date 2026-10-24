"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORY_HI, EXPERT_CATEGORIES, KUNDLI_SECTIONS, PERSONAL_CATEGORIES, type KundliSection } from "@/lib/kundliLibrary";
import { KUNDLI_LINKS, PANCHANG_LINKS, HOROSCOPE_LINKS } from "@/lib/nav";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { localizeHref } from "@/lib/i18n/locale";

type Props = { mode:"user"|"astrologer"; go:(slug:string)=>void };

export function KundliNavigation({ mode, go, tab }: Props & { tab:string }) {
  const locale = useLocale(); const hi = locale === "hi";
  const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const categories = mode === "user" ? PERSONAL_CATEGORIES : EXPERT_CATEGORIES;
  const section = KUNDLI_SECTIONS.find(item => item.tab === tab);
  const category = mode === "user" ? section?.personal : section?.expert;
  const name = (item:KundliSection) => hi ? item.titleHi : item.title;
  const choose = (slug:string) => { setOpen(false); setQuery(""); go(slug); };
  const found = KUNDLI_SECTIONS.filter(item => `${item.title} ${item.titleHi} ${item.description} ${item.slug}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <div id="kundli-sections" className="rebuilt-navigation"><nav aria-label={hi ? "कुंडली अनुभाग" : "Kundli sections"}>
      <button type="button" aria-current={tab === "Summary" ? "page" : undefined} onClick={() => choose("summary")}>{hi ? "अवलोकन" : "Overview"}</button>
      {categories.map(group => <button type="button" key={group} aria-current={category === group ? "page" : undefined} onClick={() => { const first = KUNDLI_SECTIONS.find(item => (mode === "user" ? item.personal : item.expert) === group); if(first) choose(first.slug); }}>{hi ? CATEGORY_HI[group] : group}</button>)}
    </nav><button className="rebuilt-library-toggle" type="button" aria-expanded={open} aria-controls="kundli-tool-library" onClick={() => setOpen(!open)}>{hi ? "सभी उपकरण" : "Tool library"}<span aria-hidden="true">{open ? " −" : " +"}</span></button></div>
    {open && <section id="kundli-tool-library" className="rebuilt-library-directory"><div className="rebuilt-row-heading"><div><h3>{hi ? "आपकी पूरी ज्योतिष लाइब्रेरी" : "Your complete astrology library"}</h3><p>{hi ? "सभी कुंडली अनुभाग और अन्य ज्योतिष उपकरण।" : `${KUNDLI_SECTIONS.length} Kundli sections, plus the site's other astrology tools.`}</p></div><button type="button" onClick={() => setOpen(false)}>{hi ? "बंद करें" : "Close library"}</button></div><label><span className="sr-only">{hi ? "कुंडली अनुभाग खोजें" : "Search Kundli sections"}</span><input type="search" className="input" placeholder={hi ? "दशा, षड्बल, करियर खोजें…" : "Search dashas, strengths, career…"} value={query} onChange={event => setQuery(event.target.value)} /></label><div className="rebuilt-directory-grid">{found.map(item => <button type="button" key={item.slug} onClick={() => choose(item.slug)}><strong>{name(item)}</strong><span>{hi ? item.descriptionHi : item.description}</span>{!item.personal && <small>{hi ? "विशेषज्ञ उपकरण" : "Specialist tool"}</small>}</button>)}</div>{!found.length && <p role="status">{hi ? "कोई अनुभाग नहीं मिला। दूसरा शब्द खोजें।" : "No sections found. Try another term."}</p>}<OtherAstrologyTools /></section>}
    {!open && category && <nav className="rebuilt-section-tabs" aria-label={hi ? "इस अनुभाग के उपकरण" : "Tools in this section"}>{KUNDLI_SECTIONS.filter(item => (mode === "user" ? item.personal : item.expert) === category).map(item => <button type="button" key={item.slug} aria-current={item.tab === tab ? "page" : undefined} onClick={() => choose(item.slug)}>{name(item)}</button>)}</nav>}
  </>;
}

export function KundliShelves({ mode, go }: Props) {
  const hi = useLocale() === "hi";
  const categories = mode === "user" ? PERSONAL_CATEGORIES : EXPERT_CATEGORIES;
  return <div className="rebuilt-shelves">{categories.map(group => <section key={group} className="rebuilt-shelf" data-shelf={group}><div className="rebuilt-row-heading"><h3>{hi ? CATEGORY_HI[group] : group}</h3><span>{KUNDLI_SECTIONS.filter(item => (mode === "user" ? item.personal : item.expert) === group).length} {hi ? "अनुभाग" : "sections"}</span></div><div className="rebuilt-poster-row">{KUNDLI_SECTIONS.filter(item => (mode === "user" ? item.personal : item.expert) === group).map(item => <button type="button" key={item.slug} onClick={() => go(item.slug)}><span className="rebuilt-poster-symbol" aria-hidden="true">{group === "Timing" ? "◷" : group === "Calculations" ? "Σ" : group === "Life areas" ? "✧" : group === "Case file" ? "⌑" : "◇"}</span><strong>{hi ? item.titleHi : item.title}</strong><p>{hi ? item.descriptionHi : item.description}</p><span className="rebuilt-poster-action">{hi ? "खोलें" : mode === "user" ? "Explore reading" : "Open analysis"}</span></button>)}</div></section>)}<OtherAstrologyTools /></div>;
}

function OtherAstrologyTools() {
  const locale = useLocale(); const hi = locale === "hi";
  const tools = [...KUNDLI_LINKS, ...HOROSCOPE_LINKS, ...PANCHANG_LINKS].filter((item,index,all) => all.findIndex(other => other.href === item.href) === index && item.href !== "/kundali");
  return <details className="rebuilt-other-tools"><summary>{hi ? "अन्य ज्योतिष उपकरण" : "More astrology tools across Astronum"}<span>{tools.length}</span></summary><div>{tools.map(item => <Link key={item.href} href={localizeHref(locale,item.href)}><strong>{hi ? item.labelHi ?? item.label : item.label}</strong><span>{hi ? item.descriptionHi ?? item.description : item.description}</span></Link>)}</div></details>;
}
