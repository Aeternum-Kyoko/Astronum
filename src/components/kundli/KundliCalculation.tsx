"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import "./calculation.css";

/** Indeterminate request status: the API does not publish calculation progress. */
export default function KundliCalculation({ name, date, time, place }: { name: string; date: string; time: string; place: string }) {
  const locale = useLocale();
  const hi = locale === "hi";
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <section className="kundli-calculation" aria-busy="true" aria-labelledby="calculation-title">
      <div className="calculation-art" aria-hidden="true">
        <svg viewBox="0 0 360 360" fill="none">
          <circle className="calculation-orbit" cx="180" cy="180" r="158" />
          {Array.from({ length: 12 }, (_, i) => <path key={i} className="calculation-tick" d="M180 17V28" transform={`rotate(${i * 30} 180 180)`} />)}
          <g className="calculation-sweep"><path d="M180 22a158 158 0 0 1 137 79" /><circle cx="180" cy="22" r="4" /></g>
          <g className="calculation-chart">
            <path className="calculation-frame" pathLength="1" d="M77 77H283V283H77Z" />
            <path className="calculation-lines" pathLength="1" d="M77 77L283 283M283 77L77 283M180 77L283 180L180 283L77 180Z" />
          </g>
          <circle className="calculation-center" cx="180" cy="180" r="7" />
          {[ [180,106], [253,180], [180,253], [106,180] ].map(([x,y], i) => <circle key={i} className="calculation-point" cx={x} cy={y} r="3" style={{ animationDelay: `${i * .3}s` }} />)}
        </svg>
        <span>{hi ? "आपकी जन्म कुंडली बन रही है" : "Your birth chart is taking shape"}</span>
      </div>
      <div className="calculation-copy">
        <h2 id="calculation-title">{hi ? "आपकी कुंडली की गणना हो रही है" : "Calculating your Kundli"}</h2>
        <p>{hi ? "आपके जन्म के समय के आकाश से, आपकी व्यक्तिगत कुंडली तक।" : "From the sky at your birth to your personal chart."}</p>
        <dl className="calculation-birth">
          {name && <div><dt>{hi ? "नाम" : "Name"}</dt><dd>{name}</dd></div>}
          <div><dt>{hi ? "जन्म" : "Birth"}</dt><dd>{date} <span>{time}</span></dd></div>
          <div><dt>{hi ? "स्थान" : "Place"}</dt><dd>{place}</dd></div>
        </dl>
        <ol className="calculation-status">
          <li><span className="calculation-check" aria-hidden="true">✓</span><div>{hi ? "जन्म विवरण प्राप्त हुए" : "Birth details received"}</div></li>
          <li aria-current="step"><span className="calculation-pulse" aria-hidden="true" /><div>{hi ? "कुंडली की गणना चल रही है" : "Chart calculation in progress"}<small>{hi ? "ग्रहों की स्थिति, वर्ग कुंडलियाँ, बल और दशा" : "Planetary positions, divisional charts, strengths and Dashas"}</small></div></li>
          <li className="calculation-pending"><span aria-hidden="true">○</span><div>{hi ? "गणना के बाद आपका कार्यक्षेत्र खुलेगा" : "Your workspace opens when ready"}</div></li>
        </ol>
        <p className="calculation-reassurance" role="status" aria-live="polite">{slow ? (hi ? "गणना अभी चल रही है। पूरा होते ही कुंडली खुल जाएगी।" : "The calculation is still running. Your chart will open as soon as it is ready.") : (hi ? "जन्म विवरण के आधार पर गणना हो रही है।" : "Calculating from your birth details.")}</p>
      </div>
    </section>
  );
}
