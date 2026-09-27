import { SIGN_SANSKRIT } from "@/lib/astrology/constants";
import { A, B, C, D, HOUSE_LABEL_ANCHORS, HOUSE_POLYGONS, P1, P2, P3, P4, polygonPoints } from "@/lib/chartGeometry";

// Fixed South Indian layout: (row, col) -> sign index, starting Pisces top-left,
// Aries fixed at (0,1), running clockwise around the border. Center 2x2 is empty.
const GRID_SIGNS: (number | null)[][] = [
  [11, 0, 1, 2],
  [10, null, null, 3],
  [9, null, null, 4],
  [8, 7, 6, 5],
];

/** Sarvashtakavarga averages 28 per sign (337/12); a planet's own chart averages 4 of 8. */
function level(count: number, sarva: boolean): "high" | "low" | "mid" {
  if (sarva) return count >= 30 ? "high" : count <= 24 ? "low" : "mid";
  return count >= 5 ? "high" : count <= 2 ? "low" : "mid";
}
const LEVEL_TEXT = { high: "text-gold-bright", low: "text-rose", mid: "text-cream" } as const;
const LEVEL_FILL = { high: "var(--color-gold-bright)", low: "var(--color-rose)", mid: "var(--color-cream)" } as const;

export default function AshtakavargaGrid({
  bindus,
  ascendantSignIndex,
  label,
  style = "south",
}: {
  bindus: number[];
  ascendantSignIndex?: number;
  label?: string;
  style?: "north" | "south";
}) {
  const total = bindus.reduce((a, b) => a + b, 0);
  const sarva = total > 100;

  return (
    <div className="mx-auto w-full max-w-md">
      {style === "north" && ascendantSignIndex !== undefined ? (
        <>
          <NorthBindus bindus={bindus} ascendantSignIndex={ascendantSignIndex} sarva={sarva} />
          <p className="mt-3 text-center text-sm text-muted">
            {label && <span>{label} · </span>}
            <span className="font-semibold text-gold-bright">{total}</span> total bindus
          </p>
        </>
      ) : (
        <div className="grid aspect-square w-full grid-cols-4 grid-rows-4 gap-1.5 rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-ink-deep p-1.5 shadow-[0_0_18px_rgba(212,175,106,0.10)]">
          {GRID_SIGNS.map((row, r) =>
            row.map((signIndex, c) => {
              if (signIndex === null) {
                if (r === 1 && c === 1) {
                  return (
                    <div key="center" className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-1">
                      {label && <span className="text-[11px] text-muted">{label}</span>}
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
                  <span className={`mt-1 text-lg font-semibold ${LEVEL_TEXT[level(count, sarva)]}`}>{count}</span>
                </div>
              );
            })
          )}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        <span className="font-semibold text-gold-bright">Gold</span> = strong sign ({sarva ? "30+" : "5+"}), <span className="font-semibold text-rose">rose</span> = weak sign ({sarva ? "24 or fewer" : "2 or fewer"}).
        {sarva ? " The average is 28." : " The average is 4 of 8."}
      </p>
    </div>
  );
}

/** The same bindus drawn in the North Indian diamond: house 1 at the top, each house showing its sign number and score. */
function NorthBindus({ bindus, ascendantSignIndex, sarva }: { bindus: number[]; ascendantSignIndex: number; sarva: boolean }) {
  return (
    <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-md overflow-visible" role="img" aria-label="Ashtakavarga bindus in North Indian style">
      <defs>
        <radialGradient id="av-bg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" style={{ stopColor: "var(--chart-top)" }} />
          <stop offset="100%" style={{ stopColor: "var(--chart-bottom)" }} />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="396" height="396" rx="10" fill="url(#av-bg)" stroke="var(--color-gold)" strokeWidth="2" />
      <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} stroke="var(--color-gold)" strokeWidth="1" opacity="0.55" />
      <line x1={B[0]} y1={B[1]} x2={D[0]} y2={D[1]} stroke="var(--color-gold)" strokeWidth="1" opacity="0.55" />
      <polygon points={`${P1.join(",")} ${P2.join(",")} ${P3.join(",")} ${P4.join(",")}`} fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.55" />
      {HOUSE_POLYGONS.map((polygon, i) => {
        const house = i + 1;
        const signIndex = (ascendantSignIndex + i) % 12;
        const count = bindus[signIndex] ?? 0;
        const [ax, ay] = HOUSE_LABEL_ANCHORS[i];
        return (
          <g key={house}>
            <polygon points={polygonPoints(polygon)} fill={house === 1 ? "rgba(212,175,106,0.10)" : "transparent"} />
            <text x={ax} y={ay - 14} textAnchor="middle" fontSize="10.5" fill="var(--color-muted)">
              {signIndex + 1}
            </text>
            <text x={ax} y={ay + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill={LEVEL_FILL[level(count, sarva)]}>
              <title>{`House ${house} · ${SIGN_SANSKRIT[signIndex]} · ${count} bindus`}</title>
              {count}
            </text>
            {house === 1 && (
              <text x={ax} y={ay + 22} textAnchor="middle" fontSize="9" fill="var(--color-gold-bright)">
                ASC
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
