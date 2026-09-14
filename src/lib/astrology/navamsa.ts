import { normalizeDegrees } from "./ayanamsa";

/**
 * Navamsa (D9) sign index for a sidereal longitude. Each sign's 30° splits
 * into nine 3°20' divisions; movable signs start their count from
 * themselves, fixed signs from the 9th sign, dual signs from the 5th —
 * which collapses to this one formula applied to the continuous zodiac
 * longitude (not the degree-within-sign).
 */
export function navamsaSignIndex(siderealLongitude: number): number {
  const division = Math.floor(normalizeDegrees(siderealLongitude) / (30 / 9));
  return division % 12;
}
