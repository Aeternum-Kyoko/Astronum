import type { Dignity } from "@/lib/astrology/dignity";
import { A, B, C, D, HOUSE_LABEL_ANCHORS, HOUSE_POLYGONS, P1, P2, P3, P4, PLANET_ABBR, polygonPoints } from "@/lib/chartGeometry";

const DIGNITY_COLOR: Record<Dignity, string> = {
  Exalted: "var(--color-gold-bright)",
  Debilitated: "var(--color-rose)",
  Moolatrikona: "var(--color-gold-bright)",
  "Own Sign": "var(--color-gold)",
  "Friend's Sign": "var(--color-cream)",
  "Enemy's Sign": "var(--color-muted)",
  "Neutral Sign": "var(--color-cream)",
};

interface ChartPlanet {
  planet: string;
  house: number;
  retrograde: boolean;
  /** Status marks (↑ ↓ R C V); defaults to "R" for retrograde planets. */
  markers?: string;
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
          <stop offset="0%" style={{ stopColor: "var(--chart-top)" }} />
          <stop offset="100%" style={{ stopColor: "var(--chart-bottom)" }} />
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
                {(p.markers ?? (p.retrograde ? "R" : "")) && (
                  <tspan fontSize="9" dy="-4">
                    {[...(p.markers ?? (p.retrograde ? "R" : ""))].map((m, i) => (
                      <tspan key={i} fill={m === "↓" || m === "C" || m === "R" ? "var(--color-rose)" : "var(--color-gold-bright)"}>
                        {m}
                      </tspan>
                    ))}
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
