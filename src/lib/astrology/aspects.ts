import type { PlanetName } from "./constants";

/** The four classical benefics whose full aspect (drishti) is read as supportive rather than afflicting. */
export const BENEFIC_PLANETS = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);

/**
 * Houses-from-self (1-12, counted the same way as `signOffsetHouse`) a planet
 * casts its special graha drishti to. Every planet casts a full aspect to the
 * 7th; Mars, Jupiter, and Saturn each add two more classical special aspects.
 * Rahu/Ketu are treated as casting only the universal 7th aspect, a common
 * simplification — this app does not model the (disputed) 5th/9th nodal
 * aspects some traditions add.
 */
export function getAspectedHouses(planet: PlanetName): number[] {
  if (planet === "Mars") return [4, 7, 8];
  if (planet === "Jupiter") return [5, 7, 9];
  if (planet === "Saturn") return [3, 7, 10];
  return [7];
}

export function aspectsSign(aspectingPlanet: PlanetName, houseDistance: number): boolean {
  return getAspectedHouses(aspectingPlanet).includes(houseDistance);
}

export interface AspectEdge {
  from: PlanetName;
  to: PlanetName;
  houseDistance: number;
  benefic: boolean;
}

/** Every graha-drishti edge among a set of planets sharing one chart (any divisional chart — pass its own sign positions). */
export function computeAspects(planets: { planet: PlanetName; signIndex: number }[]): AspectEdge[] {
  const edges: AspectEdge[] = [];
  for (const from of planets) {
    for (const to of planets) {
      if (from.planet === to.planet) continue;
      const houseDistance = ((to.signIndex - from.signIndex + 12) % 12) + 1;
      if (!aspectsSign(from.planet, houseDistance)) continue;
      edges.push({ from: from.planet, to: to.planet, houseDistance, benefic: BENEFIC_PLANETS.has(from.planet) });
    }
  }
  return edges;
}
