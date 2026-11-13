"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DASHA_SEQUENCE, NAKSHATRAS, SIGNS, SIGN_LORDS, type PlanetName } from "@/lib/astrology/constants";
import { planetKeynote } from "@/lib/astrology/content";
import { tithiIndex, tithiName } from "@/lib/astrology/birthDetails";
import { skyDegreeText, type SkyPosition } from "@/lib/skyDial";
import { term } from "@/lib/i18n/terms";

export default function LiveTransits({ positions, at, locale }: { positions: SkyPosition[]; at: string; locale: "en" | "hi" }) {
  const [sky, setSky] = useState({ positions, at });
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<PlanetName>("Moon");
  const hi = locale === "hi";
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/sky", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Unable to refresh");
        const data = await response.json() as { at: string; positions: SkyPosition[] };
        if (!Number.isFinite(Date.parse(data.at)) || !Array.isArray(data.positions) || data.positions.length !== positions.length || new Set(data.positions.map(p => p.planet)).size !== positions.length || !data.positions.every(p => positions.some(initial => initial.planet === p.planet) && Number.isFinite(p.longitude) && p.longitude >= 0 && p.longitude < 360)) throw new Error("Invalid snapshot");
        setSky(data); setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { pending = false; }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [positions]);
  const active = sky.positions.find(p => p.planet === selected)!;
  const nak = Math.floor(active.longitude / (360 / 27));
  const sign = Math.floor(active.longitude / 30);
  const pada = Math.floor(active.longitude / (360 / 108)) % 4 + 1;
  const sun = sky.positions.find(p => p.planet === "Sun")!;
  const moon = sky.positions.find(p => p.planet === "Moon")!;
  const lunar = tithiName(tithiIndex(sun.longitude, moon.longitude));
  return <section id="live-transits" className="live-transits" aria-labelledby="transit-title">
    <header className="transit-heading"><div><span className="atlas-live"><i aria-hidden="true" />{hi ? "लाहिरी निरयन गोचर" : "Live Lahiri sidereal transits"}</span><h2 id="transit-title">{hi ? "आकाश का हर अंश।" : "Every degree tells you more."}</h2><p>{hi ? "ग्रह चुनें और उसकी वर्तमान राशि, नक्षत्र और पारंपरिक अर्थ जानें।" : "The detail behind the view. Choose a graha to explore its position and traditional meaning."}</p></div><div className="transit-timestamp"><time dateTime={sky.at}>{new Date(sky.at).toLocaleString(hi ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} IST</time><span role="status">{failed ? (hi ? "अपडेट उपलब्ध नहीं। अंतिम गणना दिखाई गई है।" : "Update unavailable. Showing the last calculation.") : (hi ? "हर मिनट नई गणना" : "Recalculated every minute")}</span></div></header>
    <div className="transit-workspace"><div className="transit-table-wrap"><table className="transit-table"><caption className="sr-only">{hi ? "नौ ग्रहों की वर्तमान स्थिति" : "Current positions of all nine grahas"}</caption><thead><tr><th scope="col">{hi ? "ग्रह" : "Graha"}</th><th scope="col">{hi ? "राशि और अंश" : "Sign & degree"}</th><th scope="col">{hi ? "नक्षत्र" : "Nakshatra"}</th></tr></thead><tbody>{sky.positions.map(p => <tr key={p.planet} data-selected={selected === p.planet}><th scope="row"><button type="button" aria-pressed={selected === p.planet} onClick={() => setSelected(p.planet)}>{term(locale, p.planet)}<span aria-hidden="true">↗</span></button></th><td><strong>{term(locale, SIGNS[Math.floor(p.longitude / 30)])}</strong><span>{skyDegreeText(p.longitude)}</span></td><td>{term(locale, NAKSHATRAS[Math.floor(p.longitude / (360 / 27))])}<small>{hi ? "पद" : "Pada"} {Math.floor(p.longitude / (360 / 108)) % 4 + 1}</small></td></tr>)}</tbody></table></div>
    <article className="transit-reading" aria-live="polite" aria-atomic="true"><span>{hi ? "अभी का गोचर" : "In transit now"}</span><h3>{term(locale, selected)}</h3><p className="transit-degree">{skyDegreeText(active.longitude)} <span>{term(locale, SIGNS[sign])}</span></p><dl><div><dt>{hi ? "नक्षत्र" : "Nakshatra"}</dt><dd>{term(locale, NAKSHATRAS[nak])} · {hi ? "पद" : "Pada"} {pada}</dd></div><div><dt>{hi ? "राशि स्वामी" : "Sign lord"}</dt><dd>{term(locale, SIGN_LORDS[sign])}</dd></div><div><dt>{hi ? "नक्षत्र स्वामी" : "Star lord"}</dt><dd>{term(locale, DASHA_SEQUENCE[nak % 9])}</dd></div><div><dt>{hi ? "आज की तिथि" : "Lunar day"}</dt><dd>{term(locale, `${lunar.paksha} ${lunar.tithi}`)}</dd></div></dl><p>{hi ? `${term(locale, selected)} के पारंपरिक कारक: ${planetKeynote(selected, locale)}।` : `In Jyotish, ${selected} signifies ${planetKeynote(selected, locale)}.`}</p><p>{hi ? "व्यक्तिगत संदर्भ के लिए इसे अपनी जन्म कुंडली के साथ देखें।" : "For personal context, read this position against your own birth chart."}</p><Link href={hi ? "/hi/kundali?tab=transits" : "/kundali?tab=transits"}>{hi ? "मेरी कुंडली में गोचर देखें" : "See transits in my Kundli"} ↗</Link></article></div>
    <details className="transit-method"><summary>{hi ? "यह गणना कैसे पढ़ें" : "How to read these positions"}</summary><p>{hi ? "ये भूकेन्द्रीय लाहिरी निरयन देशांतर हैं। अंश राशि के भीतर दिखाए गए हैं। ऊपर का सौरमंडल सूर्य-केंद्रित दृश्य है, इसलिए उसके कोण इस तालिका से अलग हैं। राहु और केतु माध्य चंद्र नोड हैं, भौतिक ग्रह नहीं।" : "These are geocentric Lahiri sidereal longitudes, with degrees measured within each sign. The solar-system background is Sun-centred, so its angles differ from this table. Rahu and Ketu are mean lunar nodes, not physical planets. The 3D sizes, distances and surface rotation are illustrative."}</p><p><a href="https://www.solarsystemscope.com/textures" target="_blank" rel="noreferrer">Textures: Solar System Scope</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · Astronomy Engine</p></details>
  </section>;
}
