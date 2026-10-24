"use client";

import { useEffect, useState } from "react";
import type { BirthParams } from "@/lib/birthParams";
import { SIGN_GLYPHS } from "@/lib/astrology/constants";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { KundaliChart } from "@/lib/astrology/types";
import KundliChart from "../KundliChart";
import "./calculation.css";

/** An indeterminate animation follows the actual request, without invented percentages. */
export default function KundliCalculation({ birth, chart }: { birth: BirthParams; chart?:KundaliChart|null }) {
  const hi = useLocale() === "hi";
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((performance.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const date = new Date(`${birth.date}T12:00:00Z`);
  const dateText = Number.isNaN(date.getTime()) ? birth.date : new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day:"numeric", month:"long", year:"numeric", timeZone:"UTC" }).format(date);
  const [hours, minutes, seconds] = birth.time.split(":");
  const hour = Number(hours);
  const timeText = `${hour % 12 || 12}:${minutes}${seconds ? `:${seconds}` : ""} ${hour >= 12 ? "PM" : "AM"}`;
  const duration = `${String(Math.floor(elapsed / 60)).padStart(2,"0")}:${String(elapsed % 60).padStart(2,"0")}`;
  return <section className="kundli-calculation" aria-busy="true" aria-labelledby="calculation-title">
    <div className="calculation-person">
      <span className="calculation-eyebrow">{hi ? "आपकी व्यक्तिगत जन्म कुंडली" : "Your personal birth chart"}</span>
      <h2 id="calculation-title">{hi ? `${birth.name}, आपकी कुंडली बन रही है।` : `Drawing your sky, ${birth.name}.`}</h2>
      <p>{hi ? "आपके जन्म के पल से शुरू होने वाली कहानी।" : "A story that begins at the moment you were born."}</p>
    </div>
    <div className="calculation-art" aria-hidden="true">
      <div className="calculation-art-halo" />
      <svg viewBox="0 0 400 400" fill="none">
        <defs><radialGradient id="calculation-glow"><stop stopColor="#d8b47c" stopOpacity=".12" /><stop offset="1" stopColor="#d8b47c" stopOpacity="0" /></radialGradient></defs>
        <circle cx="200" cy="200" r="190" fill="url(#calculation-glow)" stroke="none" />
        <circle className="calculation-orbit" cx="200" cy="200" r="182" /><circle className="calculation-orbit calculation-orbit-inner" cx="200" cy="200" r="151" />
        {Array.from({ length:60 },(_,i) => <path key={i} className="calculation-tick" d={i % 5 === 0 ? "M200 18V29" : "M200 18V23"} transform={`rotate(${i * 6} 200 200)`} />)}
        {SIGN_GLYPHS.map((sign,i) => { const angle=(i * 30 - 75) * Math.PI / 180;return <text key={i} x={200 + 166 * Math.cos(angle)} y={205 + 166 * Math.sin(angle)} textAnchor="middle" fontSize="16" fill="currentColor" stroke="none" className="calculation-zodiac" style={{ animationDelay:`${i * .08}s` }}>{sign}</text>; })}
        <g className="calculation-sweep"><path d="M200 18a182 182 0 0 1 158 91" /><circle cx="200" cy="18" r="4" /></g>
        {!chart && <g className="calculation-chart">
          <path className="calculation-frame" pathLength="1" d="M103 103H297V297H103Z" />
          <path className="calculation-lines" pathLength="1" d="M103 103L297 297M297 103L103 297M200 103L297 200L200 297L103 200Z" />
          <path className="calculation-inner-light" d="M200 103 297 200 200 200Z" fill="currentColor" fillOpacity=".05" stroke="none" />
        </g>}
        {[[200,131],[269,200],[200,269],[131,200],[150,150],[250,250]].map(([x,y],i) => <g key={i} className="calculation-planet-point" style={{ animationDelay:`${.4 + i * .18}s` }}><circle cx={x} cy={y} r="9" className="calculation-point-halo" /><circle className="calculation-point" cx={x} cy={y} r="3" /></g>)}
        <circle cx="200" cy="200" r="23" fill="#151a24" stroke="currentColor" strokeOpacity=".5" />
        <text x="200" y="207" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22">{birth.name.trim().slice(0,1).toLocaleUpperCase()}</text>
      </svg>
      {chart && <div className="entry-actual-chart"><KundliChart ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} style="north" showLegend={false} ariaLabel={hi ? "आपकी गणना की गई जन्म कुंडली" : "Your calculated birth chart"}/></div>}
      <span className="calculation-art-caption">{hi ? "जन्म के आकाश से आपकी कुंडली तक" : "From your birth moment to your Kundli"}</span>
    </div>
    <div className="calculation-details">
      <div className="calculation-ticket">
        <div className="calculation-ticket-top"><span>{hi ? "जन्म विवरण" : "Birth details received"}</span><span className="calculation-check">✓</span></div>
        <strong>{birth.name}</strong>
        <dl className="calculation-birth">
          <div><dt>{hi ? "जन्म तिथि" : "Born on"}</dt><dd>{dateText}</dd></div>
          <div><dt>{hi ? "जन्म समय" : "Birth time"}</dt><dd>{timeText}</dd></div>
          <div><dt>{hi ? "जन्म स्थान" : "Birthplace"}</dt><dd>{birth.place}</dd></div>
          <div><dt>{hi ? "समय क्षेत्र" : "Time zone"}</dt><dd>{birth.timezone}</dd></div>
        </dl>
        <div className="calculation-coordinates"><span>{Math.abs(birth.latitude).toFixed(4)}° {birth.latitude < 0 ? "S" : "N"}</span><span>{Math.abs(birth.longitude).toFixed(4)}° {birth.longitude < 0 ? "W" : "E"}</span></div>
      </div>
      <div className="calculation-live"><span className="calculation-pulse" aria-hidden="true" /><span>{chart ? hi ? "आपका कुंडली कक्ष तैयार हो रहा है" : "Entering your Kundli workspace" : hi ? "कुंडली की गणना जारी है" : "Calculating your chart"}</span><time aria-label={hi ? "बीता हुआ समय" : "Elapsed time"}>{duration}</time></div>
      <div className="calculation-progress" role="progressbar" aria-label={hi ? "कुंडली की गणना जारी है" : "Birth chart calculation in progress"}><span /></div>
      <p className="calculation-includes">{hi ? "ग्रह स्थिति, लग्न, वर्ग कुंडलियाँ और विंशोत्तरी दशा" : "Planetary positions, Lagna, divisional charts & Vimshottari Dasha"}</p>
      <p className="calculation-reassurance" role="status">{elapsed >= 10 ? (hi ? "गणना अभी चल रही है। तैयार होते ही कुंडली खुल जाएगी।" : "Still working on your chart. It will open as soon as the calculation is ready.") : (hi ? "गणना पूरी होते ही आपकी व्याख्या खुलेगी।" : "Your reading opens when the calculation is ready.")}</p>
    </div>
  </section>;
}
