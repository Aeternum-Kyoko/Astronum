"use client";

import type { KundaliChart } from "@/lib/astrology/types";
import type { TopicKey } from "@/lib/astrology/topicReading";
import { periodsAt } from "@/lib/astrology/dashaTree";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { useAnalysis } from "./AnalysisContext";

const TOPICS: { key: TopicKey; title: [string, string]; subtitle: [string, string]; path: string }[] = [
  { key: "career", title: ["Career", "करियर"], subtitle: ["Purpose & ambition", "उद्देश्य और प्रगति"], path: "M48 90V52H112V90M62 52V36H98V52M80 52V90" },
  { key: "relationships", title: ["Relationships", "संबंध"], subtitle: ["Connection & partnership", "जुड़ाव और साझेदारी"], path: "M80 88 49 59C28 31 65 17 80 44 95 17 132 31 111 59Z" },
  { key: "wealth", title: ["Money", "धन"], subtitle: ["Resources & stability", "संसाधन और स्थिरता"], path: "M80 22 113 60 80 98 47 60ZM47 60H113M80 22V98" },
  { key: "education", title: ["Learning", "शिक्षा"], subtitle: ["Curiosity & growth", "जिज्ञासा और विकास"], path: "M36 45 80 24 124 45 80 66ZM50 54V82Q80 102 110 82V54" },
  { key: "property", title: ["Home", "घर"], subtitle: ["Roots & belonging", "आधार और अपनापन"], path: "M38 65 80 28 122 65M49 56V96H111V56M70 96V72H90V96" },
];

export function ReadingFeature({ chart, go }: { chart: KundaliChart; go: (slug: string) => void }) {
  const a = useAnalysis()!;
  const locale = useLocale();
  const L = pick(locale);
  const n = (value: string) => term(locale, value);
  const moon = chart.planets.find(planet => planet.planet === "Moon");
  const running = periodsAt(chart.dashas, a.at, 3);
  return <>
    <header className="cinema-feature">
      <div className="cinema-feature-copy">
        <span className="cinema-feature-series">{L("Your personal sky", "आपका अपना आकाश")}</span>
        <h2>{L("A sky that's", "आपका आकाश,")}<br />{L("uniquely yours.", "आपकी कहानी।")}</h2>
        <div className="cinema-birth-signs"><span>{n(chart.ascendant.sign)} {L("rising", "लग्न")}</span>{moon && <span>{n(moon.sign)} {L("Moon", "चंद्र")}</span>}</div>
        <p>{L("Start with your birth chart. Discover your patterns, explore what matters to you, and follow how your sky changes over time.", "अपनी जन्म कुंडली से शुरू करें। अपने स्वभाव के संकेत समझें, जीवन के विषय चुनें और समय के साथ बदलते आकाश को देखें।")}</p>
        <div className="cinema-feature-actions"><button type="button" onClick={() => go("rasi")}><span aria-hidden="true">▶</span> {L("Explore my chart", "मेरी कुंडली देखें")}</button><button type="button" onClick={() => go("report")}>{L("Read my story", "मेरी व्याख्या पढ़ें")}</button></div>
        {moon && <p className="cinema-nakshatra">{L("Birth nakshatra", "जन्म नक्षत्र")} <strong>{n(moon.nakshatra)}</strong></p>}
      </div>
      <div className="cinema-feature-art" aria-hidden="true"><div className="cinema-planet" /><svg viewBox="0 0 400 400" fill="none"><circle cx="200" cy="200" r="182" /><circle cx="200" cy="200" r="158" strokeDasharray="1 12" /><path d="M200 30 370 200 200 370 30 200ZM80 80H320V320H80ZM80 80 320 320M320 80 80 320" /><circle cx="200" cy="18" r="5" fill="currentColor" /><circle cx="382" cy="200" r="4" fill="currentColor" /></svg></div>
    </header>
    <section className="cinema-timing" aria-labelledby="cinema-timing-title"><div><h3 id="cinema-timing-title">{L("Your current chapter", "आपकी वर्तमान दशा")}</h3><p>{L("Planetary periods at the selected reading date", "चुनी गई विश्लेषण तिथि पर ग्रह दशाएँ")}</p></div><strong>{running.map(period => n(period.lord)).join(" › ") || "—"}</strong><button type="button" onClick={() => go("dashas")}>{L("Explore dashas", "दशाएँ देखें")}</button></section>
  </>;
}

export function ReadingTopics({ selected, onSelect }: { selected: TopicKey; onSelect: (key: TopicKey) => void }) {
  const L = pick(useLocale());
  return <>
    <div className="cinema-row-heading"><div><h3 id="personal-area-title">{L("Explore your life", "अपने जीवन को जानें")}</h3><p>{L("Pick a chapter. Find the bigger picture.", "एक विषय चुनें और विस्तार से समझें।")}</p></div><span>{L("5 personal readings", "5 व्यक्तिगत व्याख्याएँ")}</span></div>
    <div className="cinema-topic-row" role="group" aria-label={L("Choose a life area", "जीवन विषय चुनें")}>{TOPICS.map(item => <button className={`cinema-topic cinema-topic-${item.key}`} type="button" key={item.key} aria-pressed={selected === item.key} aria-controls="personal-selected-reading" onClick={() => onSelect(item.key)}><span className="cinema-topic-art" aria-hidden="true"><svg viewBox="0 0 160 120" fill="none"><circle cx="80" cy="60" r="48" /><circle cx="80" cy="60" r="37" /><path d={item.path} /></svg></span><span className="cinema-topic-copy"><strong>{L(...item.title)}</strong><span>{L(...item.subtitle)}</span></span><span className="cinema-topic-selected">{selected === item.key ? L("Reading below", "व्याख्या नीचे है") : L("Explore reading", "व्याख्या देखें")}</span></button>)}</div>
  </>;
}

export function TimingLibrary({ go }: { go: (slug: string) => void }) {
  const L = pick(useLocale());
  const items = [
    { slug: "transits", title: L("The sky today", "आज का आकाश"), body: L("See moving planets against your birth chart.", "अपनी जन्म कुंडली के साथ ग्रहों का गोचर देखें।"), symbol: "☉" },
    { slug: "monthly", title: L("Your month ahead", "आपका आने वाला महीना"), body: L("Explore the changing themes of this month.", "इस महीने के बदलते संकेत जानें।"), symbol: "☽" },
    { slug: "annual", title: L("A wider perspective", "एक विस्तृत दृष्टि"), body: L("Open your annual reading and the year ahead.", "अपनी वार्षिक व्याख्या और आने वाला वर्ष देखें।"), symbol: "♄" },
  ];
  return <section className="cinema-timing-library" aria-labelledby="cinema-ahead-title"><div className="cinema-row-heading"><div><h3 id="cinema-ahead-title">{L("Follow your unfolding sky", "अपने बदलते आकाश को जानें")}</h3><p>{L("From today's transits to the year ahead.", "आज के गोचर से आने वाले वर्ष तक।")}</p></div></div><div className="cinema-timing-row">{items.map(item => <button type="button" key={item.slug} onClick={() => go(item.slug)}><span aria-hidden="true">{item.symbol}</span><strong>{item.title}</strong><p>{item.body}</p><small>{L("Open reading", "व्याख्या खोलें")}</small></button>)}</div></section>;
}
