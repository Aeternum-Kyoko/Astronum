import Link from "next/link";
import SolarSystem from "@/components/SolarSystem";
import LiveTransits from "@/components/LiveTransits";
import { skyNow } from "@/lib/skySnapshot";
import { SIGNS, SIGN_GLYPHS } from "@/lib/astrology/constants";
import { term } from "@/lib/i18n/terms";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import "./atlas-home.css";
import ResponsiveHome from "./ResponsiveHome";

const chapters = [
  { planet:2, side:"right", name:"Earth", hiName:"पृथ्वी", title:"A sky that belongs to you.", hiTitle:"आपका अपना आकाश।", description:"Return to the moment you were born. Explore your houses, planetary placements and dashas, with explanations that make your Kundli easier to understand.", hiDescription:"जन्म के पल में लौटें। भाव, ग्रह स्थिति और दशाओं को सरल व्याख्या के साथ समझें।", path:"/kundali", action:"Explore my birth chart", hiAction:"मेरी जन्म कुंडली बनाएं", features:"Birth chart / Dashas / Divisional charts", hiFeatures:"जन्म कुंडली / दशा / वर्ग कुंडली" },
  { planet:1, side:"left", name:"Venus", hiName:"शुक्र", title:"Two stories. A shared sky.", hiTitle:"दो कहानियाँ। एक साझा आकाश।", description:"Bring two birth charts together. Understand the traditional points of compatibility and the nuances behind a matching score.", hiDescription:"दो जन्म कुंडलियों को साथ देखें। पारंपरिक गुण मिलान और उसके पीछे की बारीकियों को समझें।", path:"/matching", action:"Explore compatibility", hiAction:"कुंडली मिलान देखें", features:"Guna Milan / Both charts / Clear context", hiFeatures:"गुण मिलान / दोनों कुंडलियाँ / सरल संदर्भ" },
  { planet:4, side:"right", name:"Jupiter", hiName:"बृहस्पति", title:"Let curiosity lead the way.", hiTitle:"जिज्ञासा से समझ की ओर।", description:"Learn the language of your chart, from the twelve houses to the twenty-seven nakshatras. Follow the sources and explore real charts in our research library.", hiDescription:"बारह भाव से सत्ताईस नक्षत्र तक, कुंडली की भाषा सीखें। शोध संग्रह में स्रोतों के साथ कुंडलियाँ देखें।", path:"/learn", action:"Discover the learning library", hiAction:"सीखने का संग्रह खोलें", features:"Planet guides / Nakshatras / Chart research", hiFeatures:"ग्रह परिचय / नक्षत्र / कुंडली शोध" },
  { planet:5, side:"left", name:"Saturn", hiName:"शनि", title:"Find your rhythm in time.", hiTitle:"समय के साथ अपनी लय खोजें।", description:"Meet each day with a little more perspective. Explore the Panchang, daily horoscopes and the transits moving through your sky right now.", hiDescription:"हर दिन को नए दृष्टिकोण से देखें। पंचांग, दैनिक राशिफल और वर्तमान गोचर जानें।", path:"/panchang", action:"Open today’s Panchang", hiAction:"आज का पंचांग देखें", features:"Panchang / Daily horoscope / Live transits", hiFeatures:"पंचांग / दैनिक राशिफल / वर्तमान गोचर" },
];
export default function HomeView({locale}:{locale:Locale}) {
  const hi=locale==="hi";
  const sky=skyNow();
  const href=(path:string)=>localizeHref(locale,path);
  return <ResponsiveHome locale={locale} positions={sky.positions} at={sky.at.toISOString()}><div className="atlas-home">
    <div className="cosmic-journey">
      <div className="cosmic-stage"><SolarSystem locale={locale} cinematic /></div>
      <div className="cosmic-chapters">
        <section className="atlas-hero cosmic-chapter" data-planet-chapter="-1">
          <div className="atlas-hero-copy cosmic-copy">
            <span className="atlas-signature">{hi?"वैदिक ज्योतिष, सरल भाषा में":"Vedic astrology, made clear"}</span>
            <h1>{hi?"आपका आकाश। आपकी कहानी।":"Your sky. Your story."}</h1>
            <p>{hi?"अपनी जन्म कुंडली बनाएं। ग्रहों को जानें। एक समय में एक बात समझें।":"Meet your birth chart. Understand your planets. One clear insight at a time."}</p>
            <Link className="atlas-primary" href={href("/kundali")}>{hi?"मेरी कुंडली बनाएं":"Create my Kundli"}<span aria-hidden="true">↗</span></Link>
            <small>{hi?"निःशुल्क · खाता बनाना ज़रूरी नहीं":"Free to explore · No account needed"}</small>
            <a className="cosmic-skip" href="#live-transits">{hi?"वर्तमान गोचर और अंश देखें":"See live transits & degrees"} ↓</a>
          </div>
        </section>
        {chapters.map(chapter=><section key={chapter.name} className="cosmic-chapter cosmic-feature" data-planet-chapter={chapter.planet} data-planet-side={chapter.side}>
          <div className="cosmic-copy"><span className="cosmic-planet-name">{hi?chapter.hiName:chapter.name}</span><h2>{hi?chapter.hiTitle:chapter.title}</h2><p>{hi?chapter.hiDescription:chapter.description}</p><p className="cosmic-feature-list">{hi?chapter.hiFeatures:chapter.features}</p><Link className="cosmic-link" href={href(chapter.path)}>{hi?chapter.hiAction:chapter.action}<span aria-hidden="true">↗</span></Link></div>
        </section>)}
      </div>
    </div>
    <LiveTransits positions={sky.positions} at={sky.at.toISOString()} locale={locale}/>
    <section className="atlas-signs"><div className="atlas-section-heading"><h2>{hi?"अपनी राशि चुनें।":"Your sign. Your daily pause."}</h2></div><div className="atlas-zodiac">{SIGNS.map((sign,i)=><Link key={sign} href={href(`/horoscope/${sign.toLowerCase()}`)}><span aria-hidden="true">{SIGN_GLYPHS[i]}</span><strong>{term(locale,sign)}</strong></Link>)}</div></section>
    <section className="atlas-note"><span aria-hidden="true">◎</span><div><h2>{hi?"कुंडली शोध संग्रह":"The chart research library"}</h2><p>{hi?"स्रोत और जन्म विवरण की सीमाओं के साथ ऐतिहासिक व पारंपरिक अध्ययन।":"Historical lives and traditional charts, with sources and uncertainty in view."}</p></div><Link href="/research">{hi?"संग्रह खोलें":"Explore the collection"} ↗</Link></section>
    <section className="atlas-note"><span aria-hidden="true">✧</span><div><h2>{hi?"परंपरा, समझ के साथ।":"Tradition, with perspective."}</h2><p>{hi?"ग्रह स्थिति की खगोलीय गणना। वैदिक परंपरा पर आधारित व्याख्या। जीवन के निर्णय आपके हैं।":"Astronomically calculated positions. Interpretations rooted in Vedic tradition. Your decisions remain yours."}</p></div><Link href={href("/about")}>{hi?"हमारी पद्धति":"Our approach"} ↗</Link></section>
  </div></ResponsiveHome>;
}
