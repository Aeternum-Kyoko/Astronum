"use client";

import { useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { analyzeBhavaStrength, type StrengthVerdict } from "@/lib/astrology/bhavaStrength";
import type { VargaKey } from "@/lib/astrology/constants";
import { analyzeHouses, findConjunctions, type AnalyzablePlanet } from "@/lib/astrology/houseAnalysis";
import type { ShadbalaResult } from "@/lib/astrology/types";
import { analyzeVargaPlanetStrength } from "@/lib/astrology/vargaPlanetStrength";
import { VARGA_LENS } from "@/lib/astrology/vargaLens";

const VERDICT_COLOR: Record<StrengthVerdict, string> = {
  Strong: "text-gold-bright",
  Balanced: "text-cream",
  Weak: "text-rose",
};

export default function ChartDetail({
  vargaKey,
  ascendantSignIndex,
  planets,
  shadbala,
}: {
  vargaKey: VargaKey;
  ascendantSignIndex: number;
  planets: AnalyzablePlanet[];
  /** Only the D1 chart carries real Shadbala rupas — pass it for D1, omit for every other varga. */
  shadbala?: ShadbalaResult[];
}) {
  const [view, setView] = useState<"houses" | "planets">("houses");

  const lens = vargaKey === "D1" ? undefined : VARGA_LENS[vargaKey].houses;
  const houses = analyzeHouses(ascendantSignIndex, planets, lens);
  const conjunctions = findConjunctions(ascendantSignIndex, planets);
  const bhavaByHouse = new Map(analyzeBhavaStrength(ascendantSignIndex, planets, shadbala).map((b) => [b.house, b]));
  const planetStrength = analyzeVargaPlanetStrength(ascendantSignIndex, planets);

  return (
    <div className="mt-14 space-y-10">
      <div className="flex justify-center">
        <SegmentedControl
          layoutId="chart-detail-view"
          value={view}
          onChange={setView}
          options={[
            { value: "houses", label: "House Analysis" },
            { value: "planets", label: "Planet Analysis" },
          ]}
        />
      </div>

      {view === "houses" ? (
        <>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-gold-bright">House-by-House</h3>
            <p className="mt-2 text-sm text-muted">
              What each house is about, who rules it, where that lord actually sits, who occupies it directly, and
              how strong it reads overall.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {houses.map((h) => {
                const strength = bhavaByHouse.get(h.house);
                return (
                  <div key={h.house} className="card-edge rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                        House {h.house} · {h.sign}
                      </p>
                      {strength && (
                        <span className={`text-xs font-semibold ${VERDICT_COLOR[strength.verdict]}`}>{strength.verdict}</span>
                      )}
                    </div>
                    {strength && <p className="mt-2 text-xs leading-relaxed text-muted">{strength.rationale}</p>}
                    <p className="mt-2 text-sm leading-relaxed text-cream">{h.narrative}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight text-gold-bright">Conjunctions</h3>
            <p className="mt-2 text-sm text-muted">Planets sharing a sign blend their significations into one combined force.</p>
            {conjunctions.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No two (or more) planets share a sign in this chart.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {conjunctions.map((c, i) => (
                  <div key={i} className="card-edge rounded-2xl p-5">
                    <p className="text-xs font-semibold tracking-wide text-gold-bright uppercase">{c.planets.join(" + ")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-cream">{c.narrative}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gold-bright">Planet-by-Planet</h3>
          <p className="mt-2 text-sm text-muted">
            Each planet&rsquo;s condition in this chart — dignity, house placement, and the aspects it gives and receives.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {planetStrength.map((p) => (
              <div key={p.planet} className="card-edge rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {p.planet} · House {p.house}
                  </p>
                  <span className={`text-xs font-semibold ${VERDICT_COLOR[p.verdict]}`}>{p.verdict}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-cream">{p.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        House and planet strength here are a heuristic composed from dignity, house placement, and aspects already
        computed for this chart — not the classical Bhava Bala system.
      </p>
    </div>
  );
}
