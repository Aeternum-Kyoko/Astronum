import { NAKSHATRAS, SIGN_LORDS, SIGNS, type PlanetName, type AshtakavargaPlanet } from "./constants";
import { rawTransitModifiers } from "./transitModifiers";
import { periodsAt } from "./dashaTree";
import { nakshatraLord } from "./dasha";
import { siderealLongitude } from "./ephemeris";
import { signOffsetHouse } from "./math";
import { panchadhaMaitri } from "./maitri";
import type { CurrentTransit } from "./transits";
import type { KundaliChart } from "./types";

const DAY = 86400_000;
const SEARCH_DAYS: Record<PlanetName, number> = { Sun: 40, Moon: 5, Mars: 1000, Mercury: 200, Jupiter: 800, Venus: 500, Saturn: 1500, Rahu: 900, Ketu: 900 };
const SEARCH_STEP: Record<PlanetName, number> = { Sun: .5, Moon: .125, Mars: .5, Mercury: .25, Jupiter: 1, Venus: .25, Saturn: 1, Rahu: 1, Ketu: 1 };
const ingressCache = new Map<string, Date | null>();

/** Latest entry, including retrograde re-entry, into the sign occupied at `at`.
 * Binary refinement resolves the numerical boundary to one second; ephemeris
 * model accuracy is separate. Null explicitly means the bounded search failed.
 */
export function currentSignIngress(planet: PlanetName, at: Date): Date | null {
  if (!Number.isFinite(at.getTime())) throw new Error("Invalid transit date.");
  const key = `${planet}:${at.toISOString()}`;
  if (ingressCache.has(key)) return ingressCache.get(key)!;
  const sign = Math.floor(siderealLongitude(planet, at) / 30);
  const step = SEARCH_STEP[planet] * DAY;
  let hi = at.getTime();
  let result: Date | null = null;
  for (let lo = hi - step; at.getTime() - lo <= SEARCH_DAYS[planet] * DAY; lo -= step) {
    if (Math.floor(siderealLongitude(planet, new Date(lo)) / 30) === sign) { hi = lo; continue; }
    while (hi - lo > 1000) {
      const mid = (lo + hi) / 2;
      if (Math.floor(siderealLongitude(planet, new Date(mid)) / 30) === sign) hi = mid;
      else lo = mid;
    }
    result = new Date(hi);
    break;
  }
  if (ingressCache.size > 256) ingressCache.clear();
  ingressCache.set(key, result);
  return result;
}

export function moortiFromHouse(house: number) {
  if (!Number.isInteger(house) || house < 1 || house > 12) throw new Error("Moon distance must be 1–12.");
  return [1, 6, 11].includes(house) ? { name: "Swarna", metal: "Gold", tone: "Supportive" }
    : [2, 5, 9].includes(house) ? { name: "Rajata", metal: "Silver", tone: "Supportive" }
    : [3, 7, 10].includes(house) ? { name: "Tamra", metal: "Copper", tone: "Demanding" }
    : { name: "Loha", metal: "Iron", tone: "Demanding" };
}

export const TARAS = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyak", "Sadhana", "Naidhana", "Mitra", "Parama Mitra"] as const;
export function transitNakshatra(longitude: number, natalMoonNakshatra: number) {
  if (!Number.isFinite(longitude) || !Number.isInteger(natalMoonNakshatra) || natalMoonNakshatra < 0 || natalMoonNakshatra > 26) throw new Error("Invalid nakshatra reference.");
  const lon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(lon / (360 / 27));
  const pada = Math.floor(lon / (360 / 108)) % 4 + 1;
  const count = ((index - natalMoonNakshatra + 27) % 27) + 1;
  const tara = (count - 1) % 9;
  return { index, name: NAKSHATRAS[index], pada, lord: nakshatraLord(index), count, tara: TARAS[tara], tone: tara === 0 ? "Mixed" : [2, 4, 6].includes(tara) ? "Demanding" : "Supportive" };
}

/** Independent traditional lenses; never collapsed into an invented probability. */
export function transitContext(chart: KundaliChart, transits: CurrentTransit[], at: Date) {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const maitri = panchadhaMaitri(transits);
  const chain = periodsAt(chart.dashas, at, 3);
  return transits.map((t) => {
    const ingress = currentSignIngress(t.planet, at);
    const moonSignIndex = ingress ? Math.floor(siderealLongitude("Moon", ingress) / 30) : null;
    const moonHouse = moonSignIndex === null ? null : signOffsetHouse(moonSignIndex, moon.signIndex);
    const signLord = SIGN_LORDS[t.signIndex];
    const relationship = t.planet === signLord ? "Own sign" : maitri.find((r) => r.from === t.planet && r.to === signLord)?.compound ?? "Not assigned";
    const bav = chart.ashtakavarga.bhinna[t.planet as AshtakavargaPlanet];
    return {
      planet: t.planet,
      ...rawTransitModifiers(chart, t, transits),
      nakshatra: transitNakshatra(t.signIndex * 30 + t.degree, moon.nakshatraIndex),
      signLord, relationship,
      natal: chart.planets.find(p => p.planet === t.planet)!,
      strength: chart.shadbala.find(p => p.planet === t.planet) ?? null,
      activeLevels: chain.flatMap((p, i) => p.lord === t.planet ? [i] : []),
      moorti: ingress && moonHouse !== null && moonSignIndex !== null ? { ...moortiFromHouse(moonHouse), ingress, moonHouse, moonSign: SIGNS[moonSignIndex] } : null,
      bav: bav?.[t.signIndex] ?? null,
      sav: chart.ashtakavarga.sarva[t.signIndex],
    };
  });
}
