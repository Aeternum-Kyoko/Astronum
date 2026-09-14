import type { Dignity } from "@/lib/astrology/dignity";

const PLANET_ABBR: Record<string, string> = {
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

const DIGNITY_COLOR: Record<Dignity, string> = {
  Exalted: "var(--color-gold-bright)",
  Debilitated: "var(--color-rose)",
  Moolatrikona: "var(--color-gold-bright)",
  "Own Sign": "var(--color-gold)",
  "Friend's Sign": "var(--color-cream)",
  "Enemy's Sign": "var(--color-muted)",
  "Neutral Sign": "var(--color-cream)",
};

// Square corners, edge midpoints, and diagonal half-midpoints used to build
// the classic North Indian diamond: outer square + both corner-to-corner
// diagonals + the diamond connecting edge midpoints. Houses 1/4/7/10 (the
// kendras) are the four kites pointing out from the center; the rest are the
// eight corner triangles.
const A = [0, 0];
const B = [400, 0];
const C = [400, 400];
const D = [0, 400];
const O = [200, 200];
const P1 = [200, 0];
const P2 = [400, 200];
const P3 = [200, 400];
const P4 = [0, 200];
const Q1 = [100, 100];
const Q2 = [300, 100];
const Q3 = [300, 300];
const Q4 = [100, 300];

// House 1 is always the top kite; from there houses are numbered
// counter-clockwise (house 2 sits to the LEFT of house 1), which is the
// standard direction for the North Indian chart format.
const HOUSE_POLYGONS: number[][][] = [
  [P1, Q2, O, Q1], // 1
  [A, Q1, P1], // 2
  [P4, A, Q1], // 3
  [P4, Q1, O, Q4], // 4
  [D, Q4, P4], // 5
  [P3, D, Q4], // 6
  [P3, Q4, O, Q3], // 7
  [C, Q3, P3], // 8
  [P2, C, Q3], // 9
  [P2, Q3, O, Q2], // 10
  [B, Q2, P2], // 11
  [P1, B, Q2], // 12
];

const HOUSE_LABEL_ANCHORS: [number, number][] = [
  [200, 58], // 1
  [130, 46], // 2
  [54, 100], // 3
  [58, 200], // 4
  [54, 300], // 5
  [130, 356], // 6
  [200, 344], // 7
  [270, 356], // 8
  [346, 300], // 9
  [344, 200], // 10
  [346, 100], // 11
  [270, 46], // 12
];

function polygonPoints(polygon: number[][]): string {
  return polygon.map(([x, y]) => `${x},${y}`).join(" ");
}

interface ChartPlanet {
  planet: string;
  house: number;
  retrograde: boolean;
  dignity?: Dignity | null;
  sign?: string;
  degreeInSign?: number;
  nakshatra?: string;
}

export default function NorthIndianChart({
  ascendantSignIndex,
  planets,
}: {
  ascendantSignIndex: number;
  planets: ChartPlanet[];
}) {
  const byHouse = new Map<number, ChartPlanet[]>();
  for (const p of planets) {
    const list = byHouse.get(p.house) ?? [];
    list.push(p);
    byHouse.set(p.house, list);
  }

  return (
    <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-md overflow-visible">
      <defs>
        <radialGradient id="nic-bg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#161d47" />
          <stop offset="100%" stopColor="#0c0f26" />
        </radialGradient>
        <linearGradient id="nic-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-bright)" />
          <stop offset="100%" stopColor="var(--color-gold)" />
        </linearGradient>
      </defs>

      <g className="drop-shadow-[0_0_18px_rgba(212,175,106,0.12)]">
        <rect x="2" y="2" width="396" height="396" rx="10" fill="url(#nic-bg)" stroke="url(#nic-line)" strokeWidth="2" />
        <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} stroke="url(#nic-line)" strokeWidth="1" opacity="0.55" />
        <line x1={B[0]} y1={B[1]} x2={D[0]} y2={D[1]} stroke="url(#nic-line)" strokeWidth="1" opacity="0.55" />
        <polygon
          points={`${P1.join(",")} ${P2.join(",")} ${P3.join(",")} ${P4.join(",")}`}
          fill="none"
          stroke="url(#nic-line)"
          strokeWidth="1"
          opacity="0.55"
        />
      </g>

      {HOUSE_POLYGONS.map((polygon, i) => {
        const houseNumber = i + 1;
        const signNumber = ((ascendantSignIndex + houseNumber - 1) % 12) + 1;
        const occupants = byHouse.get(houseNumber) ?? [];
        const [ax, ay] = HOUSE_LABEL_ANCHORS[i];
        const isAscendant = houseNumber === 1;

        return (
          <g key={houseNumber}>
            <polygon
              points={polygonPoints(polygon)}
              fill={isAscendant ? "rgba(212,175,106,0.10)" : "transparent"}
              stroke={isAscendant ? "rgba(212,175,106,0.4)" : "none"}
              strokeWidth={isAscendant ? 1.5 : 0}
            />
            <text x={ax} y={ay - 14} textAnchor="middle" fontSize="10.5" fill="var(--color-muted)" opacity="0.85">
              {signNumber}
            </text>
            {occupants.map((p, idx) => (
              <text
                key={p.planet}
                x={ax}
                y={ay + idx * 15}
                textAnchor="middle"
                fontSize="13.5"
                fontWeight="600"
                fill={p.dignity ? DIGNITY_COLOR[p.dignity] : "var(--color-cream)"}
              >
                <title>
                  {[p.planet, p.sign, p.degreeInSign !== undefined ? `${p.degreeInSign.toFixed(2)}°` : null, `House ${houseNumber}`, p.nakshatra, p.dignity, p.retrograde ? "Retrograde" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </title>
                {PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2)}
                {p.retrograde && (
                  <tspan fill="var(--color-rose)" fontSize="9" dy="-3">
                    R
                  </tspan>
                )}
              </text>
            ))}
            {isAscendant && (
              <text x={ax} y={ay + occupants.length * 15 + 13} textAnchor="middle" fontSize="9" letterSpacing="0.5" fill="var(--color-gold-bright)">
                ASC
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
