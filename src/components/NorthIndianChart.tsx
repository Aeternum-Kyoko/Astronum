import type { Dignity } from "@/lib/astrology/dignity";
import { A, B, C, D, HOUSE_POLYGONS, P1, P2, P3, P4, PLANET_GLYPH, SIGN_ANCHORS, layoutHouse, markerText, planetAbbr, polygonPoints } from "@/lib/chartGeometry";
import type { Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";

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
  locale = "en",
}: {
  ascendantSignIndex: number;
  planets: ChartPlanet[];
  /** Makes houses and planets selectable (for a detail panel). */
  onPick?: (pick: ChartPick) => void;
  selected?: ChartPick | null;
  /** Planet symbols (☉ ☽ ♂…) instead of two-letter names. */
  glyphs?: boolean;
  locale?: Locale;
}) {
  const hi = locale === "hi";
  const tr = (s: string) => (hi ? term("hi", s) : s);
  const byHouse = new Map<number, ChartPlanet[]>();
  for (const p of planets) {
    const list = byHouse.get(p.house) ?? [];
    list.push(p);
    byHouse.set(p.house, list);
  }

  return (
    <svg viewBox="0 0 400 400" className="chart-draw mx-auto w-full max-w-md overflow-visible" role="img" aria-label={hi ? "जन्म कुंडली, उत्तर भारतीय शैली" : "Birth chart, North Indian style"}>
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
        const [sx, sy] = SIGN_ANCHORS[i];
        const isAscendant = houseNumber === 1;
        const picked = selected?.kind === "house" && selected.house === houseNumber;
        // Planets are laid out in a grid that always fits inside the house, shrinking only when crowded.
        const layout = layoutHouse(houseNumber, occupants.length, isAscendant ? 12 : 0);
        const fs = (glyphs ? 16 : 14) * layout.scale;

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
                    "aria-label": hi ? `भाव ${houseNumber}` : `House ${houseNumber}`,
                    className: "cursor-pointer outline-none transition-[fill] hover:fill-[color-mix(in_oklab,var(--color-gold)_12%,transparent)] focus-visible:stroke-[var(--color-gold-bright)] focus-visible:[stroke-width:1.5]",
                    onClick: () => onPick({ kind: "house", house: houseNumber }),
                    onKeyDown: keyActivate(() => onPick({ kind: "house", house: houseNumber })),
                  }
                : {})}
            />
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--color-muted)" opacity="0.85" className="chart-fade" style={{ fontVariantNumeric: "tabular-nums" }}>
              {signNumber}
            </text>
            {occupants.map((p, idx) => {
              const marks = p.markers ?? (p.retrograde ? "R" : "");
              const isPicked = selected?.kind === "planet" && selected.planet === p.planet;
              return (
                <text
                  key={p.planet}
                  x={layout.points[idx][0]}
                  y={layout.points[idx][1]}
                  textAnchor="middle"
                  fontSize={fs}
                  fontWeight="600"
                  className={onPick ? "chart-fade cursor-pointer outline-none" : "chart-fade"}
                  fill={p.dignity ? DIGNITY_COLOR[p.dignity] : "var(--color-cream)"}
                  textDecoration={isPicked ? "underline" : undefined}
                  style={glyphs ? { fontFamily: "'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif" } : undefined}
                  {...(onPick
                    ? {
                        role: "button",
                        tabIndex: 0,
                        "aria-label": tr(p.planet),
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          onPick({ kind: "planet", planet: p.planet });
                        },
                        onKeyDown: keyActivate(() => onPick({ kind: "planet", planet: p.planet })),
                      }
                    : {})}
                >
                  <title>
                    {[
                      tr(p.planet),
                      p.sign ? tr(p.sign) : null,
                      p.degreeInSign !== undefined ? `${p.degreeInSign.toFixed(2)}°` : null,
                      hi ? `भाव ${houseNumber}` : `House ${houseNumber}`,
                      p.nakshatra ? tr(p.nakshatra) : null,
                      p.dignity ? tr(p.dignity) : null,
                      p.retrograde ? (hi ? "वक्री" : "Retrograde") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </title>
                  {glyphs ? PLANET_GLYPH[p.planet] : planetAbbr(p.planet, locale)}
                  {p.degreeInSign !== undefined && layout.degrees && (
                    <tspan fontSize={8.5 * layout.scale} fontWeight="400" fill="var(--color-muted)" dx="2" style={{ fontVariantNumeric: "tabular-nums", fontFamily: "inherit" }}>
                      {Math.floor(p.degreeInSign)}°
                    </tspan>
                  )}
                  {marks && (
                    <tspan fontSize={8.5 * Math.max(layout.scale, 0.8)} dy={-5 * layout.scale} style={{ fontFamily: "inherit" }}>
                      {[...marks].map((m, k) => (
                        <tspan key={k} fill={m === "↓" || m === "C" || m === "R" ? "var(--color-rose)" : "var(--color-gold-bright)"}>
                          {markerText(m, locale)}
                        </tspan>
                      ))}
                    </tspan>
                  )}
                </text>
              );
            })}
            {isAscendant && (
              <text x={200} y={160} textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.6" fill="var(--color-gold-bright)" className="chart-fade">
                {hi ? "लग्न" : "Lagna"}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
