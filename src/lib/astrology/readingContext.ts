import { getAspectedHouses } from "./aspects";
import { isCombust } from "./birthDetails";
import { type VargaKey } from "./constants";
import { getDignity } from "./dignity";
import { periodsAt } from "./dashaTree";
import type { KundaliChart } from "./types";

/** A shared evidence lens: keep the raw measurements separate from interpretation. */
export function readingContext(chart: KundaliChart, houses: readonly number[], vargas: readonly VargaKey[], at: Date) {
  const active = periodsAt(chart.dashas, at, 3).map((p) => p.lord);
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  return houses.map((house) => {
    const lord = chart.houseLords.find((h) => h.house === house)!;
    const planet = chart.planets.find((p) => p.planet === lord.lord)!;
    const strength = chart.shadbala.find((p) => p.planet === lord.lord);
    const occupants = chart.planets.filter((p) => p.house === house);
    const aspects = chart.planets.filter((p) => p.house !== house && getAspectedHouses(p.planet).includes(((house - p.house + 12) % 12) + 1));
    const linked = new Set([lord.lord, ...occupants.map((p) => p.planet), ...aspects.map((p) => p.planet)]);
    return {
      house, lord, planet, occupants, aspects, strength,
      combust: planet.planet !== "Sun" && isCombust(planet, sun),
      chalitHouse: chart.chalitHouses.find((p) => p.planet === lord.lord)?.house ?? planet.house,
      bindus: chart.ashtakavarga.sarva[(chart.ascendant.signIndex + house - 1) % 12],
      activeLords: active.filter((p) => linked.has(p)),
      vargas: vargas.map((key) => {
        const varga = chart.divisionalCharts[key];
        const placement = varga.planets.find((p) => p.planet === lord.lord)!;
        return { key, placement, dignity: getDignity(placement.planet, placement.signIndex), vargottama: placement.signIndex === planet.signIndex };
      }),
    };
  });
}

/** Topic-specific lenses; raw chart and system tabs retain their own methods. */
export const SECTION_LENSES: Record<string, { houses: number[]; vargas: VargaKey[] }> = {
  "Astrologer Workspace": { houses: [1,4,7,10], vargas: ["D9","D10"] },
  "Birth Precision": { houses: [1], vargas: ["D9"] },
  "Event Journal": { houses: [4,5,7,10], vargas: ["D9","D10"] },
  "Calculation Details": { houses: [], vargas: [] },
  "Compare Charts": { houses: [1,7,10], vargas: ["D9","D10"] },
  Relationships: { houses: [7,2,5,11], vargas: ["D9"] },
  Wealth: { houses: [2,11,5,9], vargas: ["D2"] },
  Education: { houses: [4,5,9], vargas: ["D24"] },
  Property: { houses: [4,2,11,12], vargas: ["D4","D16"] },
  Summary: { houses: [1, 4, 7, 10], vargas: ["D9"] },
  Dashboard: { houses: [1, 2, 7, 10], vargas: ["D9"] },
  Overview: { houses: [1, 5, 9], vargas: ["D9"] },
  "Annual Reading": { houses: [], vargas: [] },
  "Monthly Forecast": { houses: [1, 4, 7, 10], vargas: ["D9", "D10"] },
  "Life Report": { houses: [1, 2, 4, 5, 7, 9, 10, 11, 12], vargas: ["D9"] },
  "Life Sectors": { houses: [2, 4, 5, 7, 9, 10, 12], vargas: ["D2", "D9", "D10"] },
  "Life Timeline": { houses: [1, 4, 7, 10], vargas: ["D9", "D10"] },
  Career: { houses: [2, 6, 10, 11], vargas: ["D10", "D24"] },
  Houses: { houses: Array.from({ length: 12 }, (_, i) => i + 1), vargas: ["D9"] },
  "Planet Readings": { houses: [1, 5, 9, 10], vargas: ["D9"] },
  Transits: { houses: [1, 4, 7, 10], vargas: [] },
  "D1 · Rasi Chart": { houses: [1, 4, 7, 10], vargas: ["D9"] },
  "D9 · Navamsa": { houses: [1, 7, 9], vargas: ["D9"] },
  "More Vargas": { houses: [2, 4, 5, 9, 10], vargas: ["D2", "D4", "D7", "D24", "D10"] },
  Ashtakavarga: { houses: [1, 2, 7, 10, 11], vargas: [] },
  Shadbala: { houses: [1, 4, 7, 10], vargas: ["D9"] },
  "House Lords": { houses: Array.from({ length: 12 }, (_, i) => i + 1), vargas: ["D9"] },
  Dashas: { houses: [1, 4, 7, 10], vargas: ["D9", "D10"] },
  "Yogini Dasha": { houses: [1, 4, 7, 10], vargas: ["D9"] },
  "Chara Dasha": { houses: [1, 4, 7, 10], vargas: ["D9"] },
  "Yogas & Doshas": { houses: [1, 5, 7, 9, 10], vargas: ["D9", "D10"] },
  "KP System": { houses: [2, 6, 7, 10, 11], vargas: [] },
  "Lal Kitab": { houses: [1, 4, 7, 10], vargas: [] },
  "Special Tables": { houses: [1, 5, 9], vargas: ["D9"] },
  Remedies: { houses: [1, 5, 9], vargas: ["D9"] },
  Rudraksha: { houses: [1, 5, 9], vargas: ["D9"] },
  "Vastu & Home": { houses: [2, 4, 12], vargas: ["D4"] },
};
