"use client";

import { DASHA_SEQUENCE, NAKSHATRAS, SIGNS, SIGN_GLYPHS, SIGN_LORDS, type PlanetName } from "@/lib/astrology/constants";
import { planetKeynote } from "@/lib/astrology/content";
import { tithiIndex, tithiName } from "@/lib/astrology/birthDetails";
import { useEffect, useId, useState } from "react";
import { term } from "@/lib/i18n/terms";
import type { SkySnapshot } from "@/lib/skySnapshot";
import { skyLabelAngles, skyDegreeText } from "@/lib/skyDial";
import "./sky-dial.css";

/**
 * The live sky: all nine grahas at their calculated Lahiri sidereal longitude,
 * on a dial engraved like a Jantar Mantar instrument — a 360° scale, the
 * twelve rashis and the twenty-seven nakshatras. 0° Aries sits at nine
 * o'clock and longitude runs counter-clockwise, as on a traditional wheel.
 */

const C = 300; // centre of the 600×600 canvas
const GRAHA_GLYPH: Record<PlanetName, string> = { Sun:"☉", Moon:"☽", Mars:"♂", Mercury:"☿", Jupiter:"♃", Venus:"♀", Saturn:"♄", Rahu:"☊", Ketu:"☋" };
const LABEL: Record<PlanetName, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
};

function point(longitude: number, r: number): [number, number] {
  const a = (longitude * Math.PI) / 180;
  return [Math.round((C - r * Math.cos(a)) * 100) / 100, Math.round((C + r * Math.sin(a)) * 100) / 100];
}

function arc(from: number, to: number, r: number): string {
  const [x1, y1] = point(from, r);
  const [x2, y2] = point(to, r);
  // Longitude increases counter-clockwise on screen, which is SVG's sweep-flag 0.
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${x2} ${y2}`;
}

export default function SkyDialInteractive({ positions, at, className = "", locale }: { positions: SkySnapshot["positions"]; at: string; className?: string; locale: "en" | "hi" }) {
  const [sky, setSky] = useState({ positions, at });
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/sky", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Sky refresh failed");
        const data = await response.json() as { at: string; positions: SkySnapshot["positions"] };
        if (!Number.isFinite(Date.parse(data.at)) || !Array.isArray(data.positions) || data.positions.length !== positions.length ||
          new Set(data.positions.map(p => p.planet)).size !== positions.length ||
          !data.positions.every(p => positions.some(initial => initial.planet === p.planet) && Number.isFinite(p.longitude) && p.longitude >= 0 && p.longitude < 360)) throw new Error("Invalid sky snapshot");
        setSky(data); setRefreshFailed(false);
      } catch {
        if (!controller.signal.aborted) setRefreshFailed(true);
      } finally { pending = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [positions]);
  const [selected, setSelected] = useState<PlanetName>("Moon");
  const gradientId = useId();
  const hi = locale === "hi";
  const active = sky.positions.find(p => p.planet === selected)!;
  const activeNak = Math.floor(active.longitude / (360 / 27));
  const pada = Math.floor((active.longitude % (360 / 27)) / (360 / 108)) + 1;
  const moon = sky.positions.find((p) => p.planet === "Moon")!;
  const moonNak = Math.floor(moon.longitude / (360 / 27));
  const sun = sky.positions.find(p => p.planet === "Sun")!;
  const lunarDay = tithiName(tithiIndex(sun.longitude, moon.longitude));
  const labels = skyLabelAngles(sky.positions);
  const summary = sky.positions
    .map((p) => `${term(locale,p.planet)} in ${term(locale,SIGNS[Math.floor(p.longitude / 30)])} ${skyDegreeText(p.longitude)}`)
    .join(", ");

  return (
    <section className={`sky-instrument ${className}`} aria-label={hi ? "वर्तमान आकाश" : "Current sky"}>
      <div className="sky-instrument-heading"><span>{hi ? "आज का गोचर चक्र" : "Today's Gochar Chakra"}</span><time dateTime={sky.at}>{new Date(sky.at).toLocaleString(hi ? "hi-IN" : "en-IN", {timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})} IST</time></div>
      <div className="sky-wheel-tools"><span>{hi ? "पृथ्वी से दृश्य · लाहिरी निरयन" : "Earth view · Lahiri sidereal"}</span><button type="button" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? (hi ? "सामान्य दृश्य" : "Fit wheel") : (hi ? "बड़ा करें" : "Enlarge wheel")}</button></div>
      <div className="sky-wheel-viewport" data-zoomed={zoomed} tabIndex={zoomed ? 0 : undefined} role="group" aria-label={hi ? "ग्रह चक्र, बड़ा होने पर स्क्रॉल करें" : "Sky wheel; scroll to explore when enlarged"}>
      <svg viewBox="-40 -40 680 680" className="sky-instrument-dial" role="group" aria-label={hi ? "ग्रह चुनने के लिए नीचे के बटन उपयोग करें" : `Sidereal sky dial: ${summary}. Select a planet below to explore.`}>
      <defs>

        <radialGradient id={`${gradientId}-hub`} cx="32%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#55432c" />
          <stop offset="40%" stopColor="#2e2418" />
          <stop offset="100%" stopColor="#15110d" />
        </radialGradient>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2d251c" />
          <stop offset="100%" stopColor="#161311" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r={296} fill={`url(#${gradientId})`} />

      <path d={arc(Math.floor(active.longitude / 30) * 30, (Math.floor(active.longitude / 30) + 1) * 30, 259)} stroke="#69c6bc" strokeWidth={24} strokeOpacity={.13} />
      {/* Engraved rings */}
      {[294, 272, 246, 212].map((r) => (
        <circle
          key={r}
          cx={C}
          cy={C}
          r={r}
          fill="none"
          stroke="#67553d"
          strokeWidth={r === 294 ? 1.5 : 1}
          className="dial-ring"
          style={{ ["--len" as string]: `${Math.ceil(2 * Math.PI * r)}` }}
        />
      ))}

      {/* 360° scale: every degree, longer every 5°, longest every 10° */}
      <g stroke="#9f8967" strokeWidth={0.75}>
        {Array.from({ length: 360 }, (_, d) => {
          const len = d % 10 === 0 ? 12 : d % 5 === 0 ? 8 : 4;
          const [x1, y1] = point(d, 294);
          const [x2, y2] = point(d, 294 - len);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} opacity={d % 10 === 0 ? 1 : 0.6} />;
        })}
      </g>

      {/* Twelve rashis */}
      <g>
        {SIGNS.map((sign, i) => {
          const [x1, y1] = point(i * 30, 272);
          const [x2, y2] = point(i * 30, 246);
          const [tx, ty] = point(i * 30 + 15, 259);
          const [nameX, nameY] = point(i * 30 + 15, 319);
          const tangent = 90 - (i * 30 + 15);
          const nameRotation = ((tangent + 270) % 180) - 90;
          return (
            <g key={sign}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#67553d" />
              <title>{term(locale, sign)}</title>
              <text x={nameX} y={nameY} transform={`rotate(${nameRotation} ${nameX} ${nameY})`} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={500} fill="#eef0f5">{term(locale, sign)}</text>
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize={19} fill="#e1d1b9">
                {SIGN_GLYPHS[i]}
              </text>
            </g>
          );
        })}
      </g>

      {/* Twenty-seven nakshatras, with the Moon's highlighted */}
      {/* The Moon's nakshatra, outlined like an engraved mark */}
      {(() => {
        const from = moonNak * (360 / 27);
        const to = (moonNak + 1) * (360 / 27);
        const [a1x, a1y] = point(from, 212);
        const [a2x, a2y] = point(from, 246);
        const [b1x, b1y] = point(to, 212);
        const [b2x, b2y] = point(to, 246);
        return (
          <g fill="none" stroke="#e8a915" strokeWidth={1.75} strokeLinejoin="round">
            <path d={arc(from, to, 212)} />
            <path d={arc(from, to, 246)} />
            <line x1={a1x} y1={a1y} x2={a2x} y2={a2y} />
            <line x1={b1x} y1={b1y} x2={b2x} y2={b2y} />
          </g>
        );
      })()}
      <g stroke="#67553d">
        {NAKSHATRAS.map((n, i) => {
          const [x1, y1] = point(i * (360 / 27), 246);
          const [x2, y2] = point(i * (360 / 27), 212);
          const [tx, ty] = point((i + .5) * (360 / 27), 229);
          return <g key={n}><title>{term(locale,n)}</title><line x1={x1} y1={y1} x2={x2} y2={y2} /><text x={tx} y={ty} fill={i === moonNak ? "#f2c14e" : "#aebbdc"} stroke="none" textAnchor="middle" dominantBaseline="central" fontSize={14}>{i+1}</text></g>;
        })}
      </g>

      {/* Exact longitude dots stay fixed; leader lines connect separated labels. */}
      <g className="dial-planets">
        {sky.positions.map((p) => {
          const [px, py] = point(p.longitude, 205);
          const [lx, ly] = point(labels.get(p.planet)!, 153);
          const accent = selected === p.planet;
          return (
            <g key={p.planet} className={selected === p.planet ? "sky-planet selected" : "sky-planet"} onClick={() => setSelected(p.planet)} style={{cursor:"pointer"}}>
              <path d={`M ${px} ${py} L ${lx} ${ly}`} fill="none" stroke={accent ? "#f2cf91" : "#7185ad"} strokeOpacity={accent ? .9 : .45} strokeWidth={accent ? 1.5 : 1} />
              <circle cx={px} cy={py} r={accent ? 5 : 3.5} fill={accent ? "#f2cf91" : "#c4cede"} />
              <g transform={`translate(${lx} ${ly})`}>
                <circle r={22} fill="#211b14" stroke={accent ? "#efd19e" : "#84704f"} strokeWidth={accent ? 2 : 1} />
                <text y={8} textAnchor="middle" fontSize={27} fill={accent ? "#f0d3a2" : "#d5c3a2"}>{GRAHA_GLYPH[p.planet]}</text>
                <text y={39} textAnchor="middle" fontSize={18} fontWeight={600} fill={accent ? "#f2cf91" : "#eef0f5"} stroke="#17130f" strokeWidth={4} paintOrder="stroke">{LABEL[p.planet]}</text>
              </g>
              <title>{`${term(locale,p.planet)}: ${term(locale,SIGNS[Math.floor(p.longitude / 30)])} ${skyDegreeText(p.longitude)}`}</title>
            </g>
          );
        })}
      </g>

      {/* The centre is the observer, never the selected planet or the Sun. */}
      <circle cx={C} cy={C} r={51} fill={`url(#${gradientId}-hub)`} stroke="#8c7856" />
      <path d="M300 254 346 300 300 346 254 300ZM267 267H333V333H267Z" fill="none" stroke="#d4b078" strokeOpacity=".4" />
      <text x={C} y={C+3} textAnchor="middle" fontSize={19} fill="#f1eadc">{hi ? "गोचर" : "Gochar"}</text>
      <text x={C} y={C+22} textAnchor="middle" fontSize={11} fill="#c9af86">{hi ? "निरयन" : "Sidereal"}</text>
      </svg>
      </div>
      <div className="sky-planet-legend" role="group" aria-label={hi ? "ग्रह चुनें" : "Select a planet"}>{sky.positions.map(p => <button key={p.planet} type="button" aria-pressed={selected === p.planet} onClick={() => setSelected(p.planet)}><span className={`sky-body-dot body-${p.planet.toLowerCase()}`} aria-hidden="true" /><span>{term(locale,p.planet)}</span><small>{skyDegreeText(p.longitude)}</small></button>)}</div>
      <div className="sky-reading" aria-live="polite" aria-atomic="true">
        <p><strong>{term(locale,selected)}</strong> {hi ? "राशि" : "in"} <strong>{term(locale,SIGNS[Math.floor(active.longitude / 30)])}</strong> <span>{skyDegreeText(active.longitude)}</span></p>
        <p>{term(locale,NAKSHATRAS[activeNak])} <span className="sky-reading-divider" aria-hidden="true">/</span> {hi ? "पद" : "Pada"} {pada} <span className="sky-reading-divider" aria-hidden="true">/</span> {hi ? "नक्षत्र" : "Nakshatra"} {activeNak+1} {hi ? " / २७" : "of 27"}</p>
        <dl className="sky-astrology-facts"><div><dt>{hi ? "राशि स्वामी" : "Sign lord"}</dt><dd>{term(locale,SIGN_LORDS[Math.floor(active.longitude / 30)])}</dd></div><div><dt>{hi ? "नक्षत्र स्वामी" : "Star lord"}</dt><dd>{term(locale,DASHA_SEQUENCE[activeNak % 9])}</dd></div><div><dt>{hi ? "आज की तिथि" : "Lunar day"}</dt><dd>{term(locale,`${lunarDay.paksha} ${lunarDay.tithi}`)}</dd></div></dl>
        <p className="sky-meaning">{hi ? `${term(locale,selected)} के पारंपरिक कारक: ${planetKeynote(selected,locale)}। व्यक्तिगत फल जानने के लिए इसे अपनी जन्म कुंडली के साथ देखें।` : `In Jyotish, ${selected} signifies ${planetKeynote(selected,locale)}. Read this transit against your birth chart for personal context.`}</p>
        <a className="sky-personal-link" href={hi ? "/hi/kundali?tab=transits" : "/kundali?tab=transits"}>{hi ? "अपनी कुंडली में गोचर देखें" : "See transits in my birth chart"}</a>
      </div>
      <p className="sky-refresh-status" role="status">{refreshFailed ? (hi ? "अपडेट उपलब्ध नहीं। अंतिम गणना दिखाई गई है।" : "Update unavailable. Showing the last calculation.") : (hi ? "हर मिनट नई गणना" : "Recalculated every minute")}</p>
      <details className="sky-method"><summary>{hi ? "इस चक्र को कैसे पढ़ें" : "How to read this wheel"}</summary><p>{hi ? "बिंदु ग्रहों के भूकेन्द्रीय लाहिरी निरयन देशांतर दिखाते हैं। चिह्नों को पढ़ने के लिए अलग रखा गया है; रेखाएँ वास्तविक स्थितियों से जोड़ती हैं। आकार और दूरी मापानुसार नहीं हैं। राहु और केतु माध्य चंद्र नोड हैं, भौतिक ग्रह नहीं। यह स्थानीय क्षितिज या दूरबीन का दृश्य नहीं है।" : "Dots mark calculated geocentric Lahiri sidereal longitudes. Planet labels are separated for readability; lines connect them to their exact positions. Sizes, lighting, and distances are illustrative. Rahu and Ketu are mean lunar nodes, not physical planets. This is a longitude chart, not a local horizon or telescope view."}</p></details>
      <p className="sky-dial-key">{hi ? "स्वर्ण चिह्न चंद्रमा का वर्तमान नक्षत्र दिखाता है। नक्षत्र चक्र में 1–27 अंक हैं।" : "Gold marks the Moon’s current Nakshatra. The star ring is numbered 1–27."}</p>
    </section>
  );
}
