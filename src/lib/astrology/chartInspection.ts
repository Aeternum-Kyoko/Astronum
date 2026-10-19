import type { KundaliChart } from "./types";
import { SIGN_LORDS, SIGNS, type PlanetName, type VargaKey } from "./constants";
import { getAspectedHouses } from "./aspects";
import { getDignity } from "./dignity";
import { readHouses, readPlanets, type VargaContext } from "./vargaReading";
import { periodsAt } from "./dashaTree";

export type InspectionPick = { kind: "planet"; planet: PlanetName } | { kind: "house"; house: number };
export interface ChartRelationships {
  focusHouse: number;
  lord: PlanetName;
  occupants: PlanetName[];
  incoming: { planet: PlanetName; house: number }[];
  outgoing: number[];
}

export function chartRelationships(detail: ReturnType<typeof inspectChart>): ChartRelationships {
  return {
    focusHouse: detail.house,
    lord: detail.lord,
    occupants: detail.occupants.map(p => p.planet),
    incoming: detail.incoming.map(p => ({ planet: p.planet, house: p.house })),
    outgoing: detail.outgoing,
  };
}

/** All house/sign relationships here belong to the named chart, never an implicit D1 fallback. */
export function inspectChart(chart: KundaliChart, key: VargaKey, pick: InspectionPick | null, at: Date) {
  const division = chart.divisionalCharts[key];
  const ascendant = key === "D1" ? chart.ascendant.signIndex : division.ascendant.signIndex;
  const planets = (key === "D1" ? chart.planets : division.planets).map(p => ({
    ...p, house: ((p.signIndex - ascendant + 12) % 12) + 1,
    dignity: key === "D1" ? chart.planets.find(n => n.planet === p.planet)?.dignity : getDignity(p.planet, p.signIndex),
  }));
  const planet = pick?.kind === "planet" ? planets.find(p => p.planet === pick.planet) ?? null : null;
  const house = pick?.kind === "house" ? Math.max(1, Math.min(12, pick.house)) : planet?.house ?? 1;
  const signIndex = (ascendant + house - 1) % 12;
  const lord = SIGN_LORDS[signIndex] as PlanetName;
  const occupants = planets.filter(p => p.house === house);
  const incoming = planets.filter(p => p.signIndex !== signIndex && getAspectedHouses(p.planet).includes(((signIndex - p.signIndex + 12) % 12) + 1));
  const outgoing = planet ? getAspectedHouses(planet.planet).map(distance => ((planet.house + distance - 2) % 12) + 1) : [];
  const ctx: VargaContext = { varga: key, ascendantSignIndex: ascendant, planets, natalSigns: Object.fromEntries(chart.planets.map(p => [p.planet, p.signIndex])), natalLords: chart.houseLords };
  const planetReading = key !== "D2" && planet ? readPlanets(ctx).find(p => p.planet === planet.planet) ?? null : null;
  const houseReading = key !== "D2" ? readHouses(ctx).find(h => h.house === house) ?? null : null;
  const related = new Set<PlanetName>(planet ? [planet.planet] : [lord, ...occupants.map(p => p.planet), ...incoming.map(p => p.planet)]);
  return { key, planets, planet, house, sign: SIGNS[signIndex], lord,
    lordPlacement: planets.find(p => p.planet === lord)!, occupants, incoming, outgoing,
    planetReading, houseReading,
    // Broad natal periods only; a varga does not have a separate Vimshottari clock.
    periods: periodsAt(chart.dashas, at, 2).filter(period => related.has(period.lord)),
    natal: planet ? chart.planets.find(p => p.planet === planet.planet)! : null,
  };
}
