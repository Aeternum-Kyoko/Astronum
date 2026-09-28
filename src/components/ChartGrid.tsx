import { SIGN_SANSKRIT } from "@/lib/astrology/constants";
import type { Dignity } from "@/lib/astrology/dignity";
import type { ChartPick } from "@/components/NorthIndianChart";
import { PLANET_GLYPH } from "@/lib/chartGeometry";

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
  Exalted: "text-gold-bright",
  Debilitated: "text-rose",
  Moolatrikona: "text-gold-bright",
  "Own Sign": "text-gold",
  "Friend's Sign": "text-cream",
  "Enemy's Sign": "text-muted",
  "Neutral Sign": "text-cream",
};

// Fixed South Indian layout: (row, col) -> sign index, starting Pisces top-left,
// Aries fixed at (0,1), running clockwise around the border. Center 2x2 is empty.
const GRID_SIGNS: (number | null)[][] = [
  [11, 0, 1, 2],
  [10, null, null, 3],
  [9, null, null, 4],
  [8, 7, 6, 5],
];

interface GridPlanet {
  planet: string;
  signIndex: number;
  retrograde: boolean;
  /** Status marks (↑ ↓ R C V); defaults to "R" for retrograde planets. */
  markers?: string;
  dignity?: Dignity | null;
  house?: number;
  degreeInSign?: number;
  nakshatra?: string;
}

export default function ChartGrid({
  ascendantSignIndex,
  planets,
  onPick,
  selected,
  glyphs = false,
}: {
  ascendantSignIndex: number;
  planets: GridPlanet[];
  onPick?: (pick: ChartPick) => void;
  selected?: ChartPick | null;
  /** Planet symbols (☉ ☽ ♂…) instead of two-letter names. */
  glyphs?: boolean;
}) {
  const bySign = new Map<number, GridPlanet[]>();
  for (const p of planets) {
    const list = bySign.get(p.signIndex) ?? [];
    list.push(p);
    bySign.set(p.signIndex, list);
  }

  return (
    <div className="chart-draw mx-auto grid aspect-square w-full max-w-md grid-cols-4 grid-rows-4 gap-1 rounded-[14px] border border-gold/60 bg-[radial-gradient(circle_at_50%_45%,var(--chart-top),var(--chart-bottom))] p-1.5 shadow-[inset_0_0_0_5px_var(--chart-bottom),inset_0_0_0_6px_color-mix(in_oklab,var(--color-border),transparent_20%)]" role="img" aria-label="Birth chart, South Indian style">
      {GRID_SIGNS.map((row, r) =>
        row.map((signIndex, c) => {
          if (signIndex === null) {
            if (r === 1 && c === 1) {
              return (
                <div key="center" className="col-span-2 row-span-2 flex items-center justify-center">
                  <span className="font-display text-4xl text-gold/30" aria-hidden="true">
                    ॐ
                  </span>
                </div>
              );
            }
            return null;
          }

          const occupants = bySign.get(signIndex) ?? [];
          const isAscendant = signIndex === ascendantSignIndex;
          const house = ((signIndex - ascendantSignIndex + 12) % 12) + 1;
          return (
            // Clicking a cell picks its house with the mouse; keyboard users pick houses from the detail panel's house list.
            <div
              key={`${r}-${c}`}
              onClick={onPick ? () => onPick({ kind: "house", house }) : undefined}
              data-haptic={onPick ? "selection" : undefined}
              className={`relative flex flex-col items-center justify-center rounded-lg border p-1 text-center transition-colors ${
                isAscendant ? "border-gold/70 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--color-gold)_16%,transparent),transparent_70%)]" : "border-border/40 bg-ink-deep/25"
              } ${onPick ? "cursor-pointer hover:border-gold/70" : ""} ${selected?.kind === "house" && selected.house === house ? "ring-1 ring-gold" : ""}`}
            >
              <span className="chart-fade text-[10px] text-muted/80">{SIGN_SANSKRIT[signIndex]}</span>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                {isAscendant && <span className="chart-fade text-[10px] font-semibold text-gold-bright">Lagna</span>}
                {occupants.map((p) => (
                  <span
                    key={p.planet}
                    {...(onPick
                      ? {
                          role: "button",
                          tabIndex: 0,
                          onClick: (e: React.MouseEvent) => {
                            e.stopPropagation();
                            onPick({ kind: "planet", planet: p.planet });
                          },
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              onPick({ kind: "planet", planet: p.planet });
                            }
                          },
                        }
                      : {})}
                    title={[
                      p.planet,
                      p.degreeInSign !== undefined ? `${p.degreeInSign.toFixed(2)}°` : null,
                      p.house !== undefined ? `House ${p.house}` : null,
                      p.nakshatra,
                      p.dignity,
                      p.retrograde ? "Retrograde" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    className={`chart-fade text-[13px] font-semibold ${p.dignity ? DIGNITY_COLOR[p.dignity] : "text-cream"} ${glyphs ? "text-[15px]" : ""}`}
                    style={glyphs ? { fontFamily: "'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif" } : undefined}
                  >
                    {glyphs ? PLANET_GLYPH[p.planet] : PLANET_ABBR[p.planet]}
                    {p.degreeInSign !== undefined && <span className="ml-px text-[9px] font-normal text-muted tabular-nums">{Math.floor(p.degreeInSign)}°</span>}
                    {[...(p.markers ?? (p.retrograde ? "R" : ""))].map((m, i) => (
                      <sup key={i} className={m === "↓" || m === "C" || m === "R" ? "text-rose" : "text-gold-bright"}>
                        {m}
                      </sup>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
