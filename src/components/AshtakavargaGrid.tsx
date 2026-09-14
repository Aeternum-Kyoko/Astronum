import { SIGN_SANSKRIT } from "@/lib/astrology/constants";

// Fixed South Indian layout: (row, col) -> sign index, starting Pisces top-left,
// Aries fixed at (0,1), running clockwise around the border. Center 2x2 is empty.
const GRID_SIGNS: (number | null)[][] = [
  [11, 0, 1, 2],
  [10, null, null, 3],
  [9, null, null, 4],
  [8, 7, 6, 5],
];

export default function AshtakavargaGrid({
  bindus,
  ascendantSignIndex,
  label,
}: {
  bindus: number[];
  ascendantSignIndex?: number;
  label?: string;
}) {
  const total = bindus.reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="grid aspect-square w-full grid-cols-4 grid-rows-4 gap-1.5 rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-ink-deep p-1.5 shadow-[0_0_18px_rgba(212,175,106,0.10)]">
        {GRID_SIGNS.map((row, r) =>
          row.map((signIndex, c) => {
            if (signIndex === null) {
              if (r === 1 && c === 1) {
                return (
                  <div key="center" className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-1">
                    {label && <span className="text-[11px] tracking-wide text-muted uppercase">{label}</span>}
                    <span className="font-display text-2xl text-gold-bright">{total}</span>
                    <span className="text-[10px] text-muted">total bindus</span>
                  </div>
                );
              }
              return null;
            }

            const count = bindus[signIndex] ?? 0;
            const isAscendant = signIndex === ascendantSignIndex;

            return (
              <div
                key={`${r}-${c}`}
                className={`flex flex-col items-center justify-center rounded-md border p-1 text-center transition-colors ${
                  isAscendant ? "border-gold bg-gold/10" : "border-border/60 bg-ink-deep/40"
                }`}
              >
                <span className="text-[10px] text-muted">{SIGN_SANSKRIT[signIndex]}</span>
                <span className="mt-1 text-lg font-semibold text-cream">{count}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
