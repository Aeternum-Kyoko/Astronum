import { computeRawPositions } from "./astrology/ephemeris";
import { lahiriAyanamsa, normalizeDegrees } from "./astrology/ayanamsa";
import type { SkyPosition } from "./skyDial";

const ORDER: SkyPosition["planet"][] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
export interface SkySnapshot { at: Date; positions: SkyPosition[] }

export function skyNow(at = new Date()): SkySnapshot {
  const raw = computeRawPositions(at);
  const ayanamsa = lahiriAyanamsa(at);
  return { at, positions: ORDER.map(planet => ({ planet, longitude: normalizeDegrees(raw.tropicalLongitudes[planet] - ayanamsa) })) };
}
