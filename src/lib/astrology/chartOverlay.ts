import type { CurrentTransit } from "./transits";
import { computeAscendantAndMidheaven } from "./ephemeris";
import { lahiriAyanamsa, normalizeDegrees } from "./ayanamsa";
/** Transit houses always use the natal ascendant, never the transit ascendant. */
export function overlayPoints(transits: CurrentTransit[], natalAscendant: number) {
  return transits.map(p => ({ planet: p.planet, house: ((p.signIndex - natalAscendant + 12) % 12) + 1, signIndex: p.signIndex, sign: p.sign, degreeInSign: p.degree, retrograde: p.retrograde, layer: "transit" as const }));
}

/** A standalone sidereal sky chart at the chosen instant and location. No natal houses or planets enter its geometry. */
export function transitSkyChart(transits: CurrentTransit[], at: Date, latitude: number, longitude: number) {
  const tropicalAscendant = computeAscendantAndMidheaven(at, latitude, longitude).ascendant;
  const siderealAscendant = normalizeDegrees(tropicalAscendant - lahiriAyanamsa(at));
  const ascendantSignIndex = Math.floor(siderealAscendant / 30);
  return {
    ascendantSignIndex,
    ascendantDegree: siderealAscendant % 30,
    points: overlayPoints(transits, ascendantSignIndex),
  };
}
