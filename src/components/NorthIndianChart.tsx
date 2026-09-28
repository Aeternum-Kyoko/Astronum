import type { Dignity } from "@/lib/astrology/dignity";
import { A, B, C, D, HOUSE_LABEL_ANCHORS, HOUSE_POLYGONS, P1, P2, P3, P4, PLANET_ABBR, PLANET_GLYPH, polygonPoints } from "@/lib/chartGeometry";

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

export type ChartPick = { kind: "planet"; planet: string } | { kind: "house"; house: number };

const keyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

const LINE = 17; // vertical rhythm between planets in a house

/**
 * The North Indian kundli: houses fixed in place, signs rotating with the
 * Lagna. Drawn as a fine engraved instrument — a double frame, hairline
 * divisions, the Lagna house lit — and it draws itself in once on first view.
 */
export default function NorthIndianChart({
  ascendantSignIndex,
  planets,
  onPick,
  selected,
  glyphs = false,
}: {
  ascendantSignIndex: number;
  planets: ChartPlanet[];
  /** Makes houses and planets selectable (for a detail panel). */
  onPick?: (pick: ChartPick) => void;
  selected?: ChartPick | null;
  /** Planet symbols (☉ ☽ ♂…) instead of two-letter names. */
  glyphs?: boolean;
}) {
  const byHouse = new Map<number, ChartPlanet[]>();
  for (const p of planets) {
    const list = byHouse.get(p.house) ?? [];
    list.push(p);
    byHouse.set(p.house, list);
  }

  return (
    <svg viewBox="0 0 400 400" className="chart-draw mx-auto w-full max-w-md overflow-visible" role="img" aria-label="Birth chart, North Indian style">
      <defs>
        <radialGradient id="nic-bg" cx="50%" cy="45%" r="75%">
          <stop offset="0%" style={{ stopColor: "var(--chart-top)" }} />
          <stop offset="100%" style={{ stopColor: "var(--chart-bottom)" }} />
        </radialGradient>
        <radialGradient id="nic-lagna" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.03" />
        </radialGradient>
      </defs>

      {/* Frame: an outer gold line and a fine inner line, like an engraved plate. */}
      <rect x="1.5" y="1.5" width="397" height="397" rx="14" fill="url(#nic-bg)" stroke="var(--color-gold)" strokeWidth="1.5" className="chart-stroke" pathLength={1} />
      <rect x="7" y="7" width="386" height="386" rx="10" fill="none" stroke="var(--color-border)" strokeWidth="0.75" opacity="0.8" className="chart-stroke" pathLength={1} />
      <g stroke="var(--color-gold)" strokeWidth="0.9" opacity="0.5" fill="none">
        <line x1={A[0] + 7} y1={A[1] + 7} x2={C[0] - 7} y2={C[1] - 7} className="chart-stroke" pathLength={1} />
        <line x1={B[0] - 7} y1={B[1] + 7} x2={D[0] + 7} y2={D[1] - 7} className="chart-stroke" pathLength={1} />
        <polygon points={`${P1[0]},${P1[1] + 7} ${P2[0] - 7},${P2[1]} ${P3[0]},${P3[1] - 7} ${P4[0] + 7},${P4[1]}`} className="chart-stroke" pathLength={1} />
      </g>

      {HOUSE_POLYGONS.map((polygon, i) => {
        const houseNumber = i + 1;
        const signNumber = ((ascendantSignIndex + houseNumber - 1) % 12) + 1;
        const occupants = byHouse.get(houseNumber) ?? [];
        const [ax, ay] = HOUSE_LABEL_ANCHORS[i];
        const isAscendant = houseNumber === 1;
        const picked = selected?.kind === "house" && selected.house === houseNumber;
        // Centre a house's planets on its anchor so crowded houses stay balanced.
        const top = ay - ((occupants.length - 1) * LINE) / 2 + 2;

        return (
          <g key={houseNumber}>
            <polygon
              points={polygonPoints(polygon)}
              fill={picked ? "color-mix(in oklab, var(--color-gold) 22%, transparent)" : isAscendant ? "url(#nic-lagna)" : "transparent"}
              stroke="none"
              {...(onPick
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": `House ${houseNumber}`,
                    className: "cursor-pointer outline-none transition-[fill] hover:fill-[color-mix(in_oklab,var(--color-gold)_12%,transparent)] focus-visible:stroke-[var(--color-gold-bright)] focus-visible:[stroke-width:1.5]",
                    onClick: () => onPick({ kind: "house", house: houseNumber }),
                    onKeyDown: keyActivate(() => onPick({ kind: "house", house: houseNumber })),
                  }
                : {})}
            />
            <text x={ax} y={top - 18} textAnchor="middle" fontSize="10" fill="var(--color-muted)" opacity="0.75" className="chart-fade" style={{ fontVariantNumeric: "tabular-nums" }}>
              {signNumber}
            </text>
            {occupants.map((p, idx) => {
              const marks = p.markers ?? (p.retrograde ? "R" : "");
              const isPicked = selected?.kind === "planet" && selected.planet === p.planet;
              return (
                <text
                  key={p.planet}
                  x={ax}
                  y={top + idx * LINE}
                  textAnchor="middle"
                  fontSize={glyphs ? 16 : 14}
                  fontWeight="600"
                  className={onPick ? "chart-fade cursor-pointer outline-none" : "chart-fade"}
                  fill={p.dignity ? DIGNITY_COLOR[p.dignity] : "var(--color-cream)"}
                  textDecoration={isPicked ? "underline" : undefined}
                  style={glyphs ? { fontFamily: "'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif" } : undefined}
                  {...(onPick
                    ? {
                        role: "button",
                        tabIndex: 0,
                        "aria-label": p.planet,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          onPick({ kind: "planet", planet: p.planet });
                        },
                        onKeyDown: keyActivate(() => onPick({ kind: "planet", planet: p.planet })),
                      }
                    : {})}
                >
                  <title>
                    {[p.planet, p.sign, p.degreeInSign !== undefined ? `${p.degreeInSign.toFixed(2)}°` : null, `House ${houseNumber}`, p.nakshatra, p.dignity, p.retrograde ? "Retrograde" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </title>
                  {glyphs ? PLANET_GLYPH[p.planet] : (PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2))}
                  {p.degreeInSign !== undefined && (
                    <tspan fontSize="8.5" fontWeight="400" fill="var(--color-muted)" dx="2" style={{ fontVariantNumeric: "tabular-nums", fontFamily: "inherit" }}>
                      {Math.floor(p.degreeInSign)}°
                    </tspan>
                  )}
                  {marks && (
                    <tspan fontSize="8.5" dy="-5" style={{ fontFamily: "inherit" }}>
                      {[...marks].map((m, k) => (
                        <tspan key={k} fill={m === "↓" || m === "C" || m === "R" ? "var(--color-rose)" : "var(--color-gold-bright)"}>
                          {m}
                        </tspan>
                      ))}
                    </tspan>
                  )}
                </text>
              );
            })}
            {isAscendant && (
              <text x={ax} y={top + occupants.length * LINE + (occupants.length ? 2 : 0)} textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.6" fill="var(--color-gold-bright)" className="chart-fade">
                Lagna
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
