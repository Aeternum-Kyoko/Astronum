import type { PlanetName } from "./constants";
import { GOCHARA_GOOD } from "./transits";
import { kakshyaAt } from "./ashtakavargaAdvanced";
import type { KundaliChart } from "./types";

const VEDHA: Partial<Record<PlanetName, Record<number, number>>> = {
  Sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  Mars: { 3: 12, 6: 9, 11: 5 },
  Mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  Jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  Venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 3, 12: 6 },
  Saturn: { 3: 12, 6: 9, 11: 5 }, Rahu: { 3: 12, 6: 9, 11: 5 }, Ketu: { 3: 12, 6: 9, 11: 5 },
};
const EXEMPT: readonly (readonly PlanetName[])[] = [["Sun", "Saturn"], ["Moon", "Mercury"], ["Rahu", "Ketu"]];
export type TransitPosition = { planet: PlanetName; signIndex: number; degree: number };

/** Shared with the monthly engine: Moon is not used as a fleeting Vedha blocker.
 * All blockers are returned; consumers must not silently ignore a second blocker.
 */
export function gocharaVedha(planet: PlanetName, signIndex: number, natalMoonSign: number, positions: readonly TransitPosition[]) {
  const houseFromMoon = ((signIndex - natalMoonSign + 12) % 12) + 1;
  const favourable = GOCHARA_GOOD[planet].includes(houseFromMoon);
  const obstructionHouse = favourable ? VEDHA[planet]?.[houseFromMoon] ?? null : null;
  const blockers = obstructionHouse === null ? [] : positions.filter(p => p.planet !== planet && p.planet !== "Moon" &&
    ((p.signIndex - natalMoonSign + 12) % 12) + 1 === obstructionHouse && !EXEMPT.some(pair => pair.includes(planet) && pair.includes(p.planet))).map(p => p.planet);
  return { houseFromMoon, favourable, obstructionHouse, blockers, tone: favourable ? blockers.length ? "Mixed" : "Supportive" : "Demanding" };
}

export function rawTransitModifiers(chart: KundaliChart, p: TransitPosition, positions: readonly TransitPosition[]) {
  const moon = chart.planets.find(p => p.planet === "Moon")!;
  return { gochara: gocharaVedha(p.planet, p.signIndex, moon.signIndex, positions), kakshya: kakshyaAt(chart, p.planet, p.signIndex * 30 + p.degree) };
}
