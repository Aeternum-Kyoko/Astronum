import { SIGNS, SIGN_LORDS, type PlanetName, type SignName } from "./constants";
import type { PlanetPlacement } from "./types";

export interface HouseLordPlacement {
  house: number;
  sign: SignName;
  lord: PlanetName;
  lordHouse: number;
  lordSign: SignName;
}

/**
 * For each of the 12 houses (from the Ascendant), finds its ruling sign's
 * lord and where that lord actually sits in the chart — the core technique
 * of Parashari house-lord analysis (e.g. "10th lord in the 2nd house").
 */
export function computeHouseLords(ascendantSignIndex: number, planets: PlanetPlacement[]): HouseLordPlacement[] {
  const byPlanet = new Map(planets.map((p) => [p.planet, p]));

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (ascendantSignIndex + i) % 12;
    const lord = SIGN_LORDS[signIndex] as PlanetName;
    const lordPlacement = byPlanet.get(lord);

    return {
      house,
      sign: SIGNS[signIndex] as SignName,
      lord,
      lordHouse: lordPlacement?.house ?? house,
      lordSign: lordPlacement?.sign ?? (SIGNS[signIndex] as SignName),
    };
  });
}
