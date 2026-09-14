import { normalizeDegrees } from "./math";

export { normalizeDegrees };

const MS_PER_DAY = 86400000;

/** Official Lahiri ayanamsa at J2000.0 (JD 2451545.0), per the Indian Calendar
 *  Reform Committee's fixed reference (23°15'00" on 1956-03-21, propagated to
 *  J2000). This is the value implemented as "Lahiri" by Swiss Ephemeris and
 *  virtually every Vedic astrology program — distinct from "True Chitrapaksha"
 *  (a modern from-scratch recomputation using Spica's current catalog
 *  position), which runs about one arcminute higher. Software that says
 *  "Lahiri" without qualification means this frozen value. */
const LAHIRI_AT_J2000 = 23.853222;

/**
 * IAU 2006 general precession in longitude, accumulated from J2000 TT,
 * in arcseconds. T is Julian centuries from J2000. This is the standard
 * precession model (Capitaine et al. 2003) — not a fitted rate — so it
 * stays accurate well beyond the human-lifetime date range this app
 * actually needs.
 */
function generalPrecessionArcsec(T: number): number {
  return 5028.796195 * T + 1.1054348 * T * T + 0.00007964 * T ** 3 - 0.000023857 * T ** 4 - 0.0000000383 * T ** 5;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa — the offset between the tropical and
 * sidereal zodiacs, in degrees, for a given date. Anchored to the verified
 * official J2000 value and extrapolated with the real IAU precession
 * polynomial, this tracks published Lahiri tables to within a few
 * arcseconds across centuries — plenty for sign, house, and divisional
 * chart placement.
 */
export function lahiriAyanamsa(date: Date): number {
  const T = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / MS_PER_DAY / 36525;
  return LAHIRI_AT_J2000 + generalPrecessionArcsec(T) / 3600;
}
