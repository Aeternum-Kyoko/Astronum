import { NAKSHATRAS, SIGNS, SIGN_GLYPHS, type PlanetName } from "@/lib/astrology/constants";
import { siderealLongitude } from "@/lib/astrology/ephemeris";

/**
 * The live sky: all nine grahas at their true sidereal longitude right now,
 * on a dial engraved like a Jantar Mantar instrument — a 360° scale, the
 * twelve rashis and the twenty-seven nakshatras. 0° Aries sits at nine
 * o'clock and longitude runs counter-clockwise, as on a traditional wheel.
 */

const C = 300; // centre of the 600×600 canvas
const ORDER: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
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

export interface SkySnapshot {
  at: Date;
  positions: { planet: PlanetName; longitude: number }[];
}

export function skyNow(at = new Date()): SkySnapshot {
  return { at, positions: ORDER.map((planet) => ({ planet, longitude: siderealLongitude(planet, at) })) };
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

export default function SkyDial({ sky, className = "" }: { sky: SkySnapshot; className?: string }) {
  const moon = sky.positions.find((p) => p.planet === "Moon")!;
  const moonNak = Math.floor(moon.longitude / (360 / 27));
  const radius = orbits(sky.positions);
  const summary = sky.positions
    .map((p) => `${p.planet} in ${SIGNS[Math.floor(p.longitude / 30)]} ${(p.longitude % 30).toFixed(0)}°`)
    .join(", ");

  return (
    <svg viewBox="0 0 600 600" className={className} role="img" aria-label={`The sky right now: ${summary}.`}>
      <defs>
        <radialGradient id="dial-sky" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1b2a55" />
          <stop offset="100%" stopColor="#0e1733" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r={296} fill="url(#dial-sky)" />

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
          return (
            <g key={sign}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a4c80" />
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
          return <line key={n} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {/* Planets: a pointer from the hub, a marker on its orbit, and its name */}
      <g className="dial-planets">
        {sky.positions.map((p) => {
          const r = radius.get(p.planet)!;
          const [hx, hy] = point(p.longitude, 34);
          const [px, py] = point(p.longitude, r);
          const [lx, ly] = point(p.longitude, r - 20);
          const [sx, sy] = point(p.longitude, 212);
          const accent = p.planet === "Sun" || p.planet === "Moon";
          return (
            <g key={p.planet}>
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
      <circle cx={C} cy={C} r={34} fill="#0a1128" stroke="#3a4c80" />
      <circle cx={C} cy={C} r={3} fill="#e8a915" />
    </svg>
  );
}
