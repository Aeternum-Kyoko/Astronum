import { getDignity } from "./dignity";
import { COMBUSTION_ORB, isCombust } from "./birthDetails";
import type { PlanetName } from "./constants";
import type { KundaliChart } from "./types";

/**
 * Status marks drawn next to a planet in every chart, as in printed Indian
 * kundlis: exalted ↑, debilitated ↓, retrograde R, combust C, vargottama V.
 */
export type Marker = "↑" | "↓" | "R" | "C" | "V";

export const MARKER_MEANING: Record<Marker, string> = {
  "↑": "Exalted",
  "↓": "Debilitated",
  R: "Retrograde",
  C: "Combust (too close to the Sun)",
  V: "Vargottama (same sign in D1 and D9)",
};

/** Markers that read as a weakness, drawn in the warning colour. */
export const WEAK_MARKERS = new Set<Marker>(["↓", "C"]);

const nodes = new Set<PlanetName>(["Rahu", "Ketu"]);

/**
 * Markers for each planet in the given chart. `signOf` gives the planet's sign
 * in the chart being drawn (D1, a varga, or a transit); combustion and
 * vargottama come from the natal D1 positions because they describe the planet
 * itself, not its position in a division.
 */
export function planetMarkers(
  chart: KundaliChart,
  signOf: (planet: PlanetName) => number,
  retrogradeOf: (planet: PlanetName) => boolean,
  opts: { vargottama?: boolean; combust?: boolean } = {}
): Record<string, string> {
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const d9 = chart.divisionalCharts.D9;
  const out: Record<string, string> = {};
  for (const p of chart.planets) {
    const marks: Marker[] = [];
    const dignity = getDignity(p.planet, signOf(p.planet));
    if (dignity === "Exalted") marks.push("↑");
    if (dignity === "Debilitated") marks.push("↓");
    if (retrogradeOf(p.planet) && !nodes.has(p.planet)) marks.push("R");
    if (opts.combust !== false && isCombust(p, sun)) marks.push("C");
    if (opts.vargottama && d9 && d9.planets.find((x) => x.planet === p.planet)?.signIndex === p.signIndex) marks.push("V");
    out[p.planet] = marks.join("");
  }
  return out;
}

/** Natal D1 markers: dignity, retrograde, combust and vargottama. */
export function natalMarkers(chart: KundaliChart): Record<string, string> {
  const d1 = new Map(chart.planets.map((p) => [p.planet, p]));
  return planetMarkers(chart, (pl) => d1.get(pl)!.signIndex, (pl) => d1.get(pl)!.retrograde, { vargottama: true });
}

/**
 * Markers for planets in transit (or any moment's sky): dignity in the sign
 * they occupy, retrograde motion, and combustion measured from the Sun's
 * position at that same moment. Vargottama has no meaning for a transit.
 */
export function transitMarkers(positions: { planet: PlanetName; signIndex: number; longitude: number; retrograde: boolean }[]): Record<string, string> {
  const sun = positions.find((p) => p.planet === "Sun");
  const out: Record<string, string> = {};
  for (const p of positions) {
    const marks: Marker[] = [];
    const dignity = getDignity(p.planet, p.signIndex);
    if (dignity === "Exalted") marks.push("↑");
    if (dignity === "Debilitated") marks.push("↓");
    if (p.retrograde && !nodes.has(p.planet)) marks.push("R");
    const orb = COMBUSTION_ORB[p.planet];
    if (sun && orb && p.planet !== "Sun") {
      const diff = Math.abs(((p.longitude - sun.longitude + 540) % 360) - 180);
      if (diff <= (p.retrograde ? orb[1] : orb[0])) marks.push("C");
    }
    out[p.planet] = marks.join("");
  }
  return out;
}
