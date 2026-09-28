import { SIGN_SANSKRIT } from "@/lib/astrology/constants";
import type { Dignity } from "@/lib/astrology/dignity";
import type { ChartPick } from "@/components/NorthIndianChart";

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
}: {
  ascendantSignIndex: number;
  planets: GridPlanet[];
  onPick?: (pick: ChartPick) => void;
  selected?: ChartPick | null;
}) {
  const bySign = new Map<number, GridPlanet[]>();
  for (const p of planets) {
    const list = bySign.get(p.signIndex) ?? [];
    list.push(p);
    bySign.set(p.signIndex, list);
  }

  return (
    <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-4 grid-rows-4 gap-1.5 rounded-xl border border-gold/40 bg-surface p-1.5">
      {GRID_SIGNS.map((row, r) =>
        row.map((signIndex, c) => {
          if (signIndex === null) {
            if (r === 1 && c === 1) {
              return (
                <div key="center" className="col-span-2 row-span-2 flex items-center justify-center">
                  <span className="font-display text-3xl text-gold/40">ॐ</span>
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
              className={`flex flex-col items-center justify-center rounded-md border p-1 text-center transition-colors ${
                isAscendant ? "border-gold bg-gold/10" : "border-border/60 bg-ink-deep/40"
              } ${onPick ? "cursor-pointer hover:border-gold" : ""} ${selected?.kind === "house" && selected.house === house ? "ring-1 ring-gold" : ""}`}
            >
              <span className="text-[10px] text-muted">{SIGN_SANSKRIT[signIndex]}</span>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                {isAscendant && <span className="text-[10px] font-semibold text-gold-bright">Asc</span>}
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
                    className={`text-xs font-semibold ${p.dignity ? DIGNITY_COLOR[p.dignity] : "text-cream"}`}
                  >
                    {PLANET_ABBR[p.planet]}
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
