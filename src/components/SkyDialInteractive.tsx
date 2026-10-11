"use client";

import { NAKSHATRAS, SIGNS, SIGN_GLYPHS, type PlanetName } from "@/lib/astrology/constants";
import { useId, useState } from "react";
import { term } from "@/lib/i18n/terms";
import type { SkySnapshot } from "./SkyDial";
import "./sky-dial.css";

/**
 * The live sky: all nine grahas at their true sidereal longitude right now,
 * on a dial engraved like a Jantar Mantar instrument — a 360° scale, the
 * twelve rashis and the twenty-seven nakshatras. 0° Aries sits at nine
 * o'clock and longitude runs counter-clockwise, as on a traditional wheel.
 */

const C = 300; // centre of the 600×600 canvas
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

/** Spreads planets that sit close together onto inner orbits so labels never collide. */
function orbits(positions: SkySnapshot["positions"]): Map<PlanetName, number> {
  const sorted = [...positions].sort((a, b) => a.longitude - b.longitude);
  const radius = new Map<PlanetName, number>();
  const ORBITS = [186, 160, 134, 108];
  sorted.forEach((p, i) => {
    let level = 0;
    for (let j = i - 1; j >= 0; j--) {
      const gap = p.longitude - sorted[j].longitude;
      if (gap > 11) break;
      level = Math.max(level, ORBITS.indexOf(radius.get(sorted[j].planet)!) + 1);
    }
    radius.set(p.planet, ORBITS[Math.min(level, ORBITS.length - 1)]);
  });
  return radius;
}

export default function SkyDialInteractive({ positions, at, className = "", locale }: { positions: SkySnapshot["positions"]; at: string; className?: string; locale: "en" | "hi" }) {
  const sky = { positions };
  const [selected, setSelected] = useState<PlanetName>("Moon");
  const gradientId = useId();
  const hi = locale === "hi";
  const active = positions.find(p => p.planet === selected)!;
  const activeNak = Math.floor(active.longitude / (360 / 27));
  const pada = Math.floor((active.longitude % (360 / 27)) / (360 / 108)) + 1;
  const moon = sky.positions.find((p) => p.planet === "Moon")!;
  const moonNak = Math.floor(moon.longitude / (360 / 27));
  const radius = orbits(sky.positions);
  const summary = sky.positions
    .map((p) => `${p.planet} in ${SIGNS[Math.floor(p.longitude / 30)]} ${(p.longitude % 30).toFixed(0)}°`)
    .join(", ");

  return (
    <section className={`sky-instrument ${className}`} aria-label={hi ? "वर्तमान आकाश" : "Current sky"}>
      <div className="sky-instrument-heading"><span>{hi ? "इस समय का आकाश" : "The sky at this moment"}</span><time dateTime={at}>{new Date(at).toLocaleString(hi ? "hi-IN" : "en-IN", {timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})} IST</time></div>
      <svg viewBox="-40 -40 680 680" className="sky-instrument-dial" role="group" aria-label={hi ? "ग्रह चुनने के लिए नीचे के बटन उपयोग करें" : `Sidereal sky dial: ${summary}. Select a planet below to explore.`}>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1b2a55" />
          <stop offset="100%" stopColor="#0e1733" />
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
          stroke="#3a4c80"
          strokeWidth={r === 294 ? 1.5 : 1}
          className="dial-ring"
          style={{ ["--len" as string]: `${Math.ceil(2 * Math.PI * r)}` }}
        />
      ))}

      {/* 360° scale: every degree, longer every 5°, longest every 10° */}
      <g stroke="#566a9e" strokeWidth={0.75}>
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
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a4c80" />
              <title>{term(locale, sign)}</title>
              <text x={nameX} y={nameY} transform={`rotate(${nameRotation} ${nameX} ${nameY})`} textAnchor="middle" dominantBaseline="central" fontSize={17} fill="#c7cfe6">{term(locale, sign)}</text>
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize={15} fill="#c7cfe6">
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
      <g stroke="#3a4c80">
        {NAKSHATRAS.map((n, i) => {
          const [x1, y1] = point(i * (360 / 27), 246);
          const [x2, y2] = point(i * (360 / 27), 212);
          const [tx, ty] = point((i + .5) * (360 / 27), 229);
          return <g key={n}><title>{term(locale,n)}</title><line x1={x1} y1={y1} x2={x2} y2={y2} /><text x={tx} y={ty} fill={i === moonNak ? "#f2c14e" : "#aebbdc"} stroke="none" textAnchor="middle" dominantBaseline="central" fontSize={10}>{i+1}</text></g>;
        })}
      </g>

      {/* Planets: a pointer from the hub, a marker on its orbit, and its name */}
      <g className="dial-planets">
        {sky.positions.map((p) => {
          const r = radius.get(p.planet)!;
          const [hx, hy] = point(p.longitude, 64);
          const [px, py] = point(p.longitude, r);
          const [lx, ly] = point(p.longitude, r - 20);
          const [sx, sy] = point(p.longitude, 212);
          const accent = p.planet === "Sun" || p.planet === "Moon";
          return (
            <g key={p.planet} className={selected === p.planet ? "sky-planet selected" : "sky-planet"} onClick={() => setSelected(p.planet)} style={{cursor:"pointer",opacity:selected === p.planet ? 1 : .55}}>
              <circle cx={px} cy={py} r={18} fill="transparent" />
              {selected === p.planet && <circle cx={px} cy={py} r={11} fill="none" stroke="#69c6bc" strokeWidth={1.5} />}
              <line x1={hx} y1={hy} x2={sx} y2={sy} stroke={accent ? "#e8a915" : "#6f82b8"} strokeOpacity={accent ? 0.7 : 0.45} strokeWidth={1} />
              <circle cx={px} cy={py} r={accent ? 6 : 4.5} fill={accent ? "#e8a915" : "#eef0f5"} stroke="#0e1733" strokeWidth={2} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill={accent ? "#f2c14e" : "#eef0f5"}>
                {LABEL[p.planet]}
              </text>
              <title>{`${p.planet}: ${SIGNS[Math.floor(p.longitude / 30)]} ${(p.longitude % 30).toFixed(1)}°`}</title>
            </g>
          );
        })}
      </g>

      {/* Hub */}
      <circle cx={C} cy={C} r={62} fill="#0a1128" stroke="#3a4c80" />
      <text x={C} y={C-13} textAnchor="middle" fontSize={16} fill="#eee9dd">{term(locale,selected)}</text>
      <text x={C} y={C+12} textAnchor="middle" fontSize={14} fill="#69c6bc">{(active.longitude % 30).toFixed(1)}°</text>
      <text x={C} y={C+33} textAnchor="middle" fontSize={10} fill="#aebbdc">{hi ? "निरयन" : "Sidereal"}</text>
      </svg>
      <div className="sky-planet-legend" role="group" aria-label={hi ? "ग्रह चुनें" : "Select a planet"}>{positions.map(p => <button key={p.planet} type="button" aria-pressed={selected === p.planet} onClick={() => setSelected(p.planet)}>{term(locale,p.planet)}</button>)}</div>
      <div className="sky-reading" aria-live="polite" aria-atomic="true">
        <p><strong>{term(locale,selected)}</strong> {hi ? "राशि" : "in"} <strong>{term(locale,SIGNS[Math.floor(active.longitude / 30)])}</strong> <span>{(active.longitude % 30).toFixed(1)}°</span></p>
        <p>{term(locale,NAKSHATRAS[activeNak])} <span className="sky-reading-divider" aria-hidden="true">/</span> {hi ? "पद" : "Pada"} {pada} <span className="sky-reading-divider" aria-hidden="true">/</span> {hi ? "नक्षत्र" : "Nakshatra"} {activeNak+1} {hi ? " / २७" : "of 27"}</p>
      </div>
      <p className="sky-dial-key">{hi ? "स्वर्ण चिह्न चंद्रमा का वर्तमान नक्षत्र दिखाता है। नक्षत्र चक्र में 1–27 अंक हैं।" : "Gold marks the Moon’s current Nakshatra. The star ring is numbered 1–27."}</p>
    </section>
  );
}
