import { DateTime } from "luxon";
import { computeVarshphal, solarReturn } from "./varshphal";
import { readingContext } from "./readingContext";
import { periodsAt } from "./dashaTree";
import { siderealLongitude } from "./ephemeris";
import { SIGNS, type PlanetName, type VargaKey } from "./constants";
import { rawTransitModifiers } from "./transitModifiers";
import { getAspectedHouses } from "./aspects";
import type { KundaliChart } from "./types";

const AREAS = [
  { key: "career", house: 10, vargas: ["D10"] },
  { key: "relationships", house: 7, vargas: ["D9"] },
  { key: "wealth", house: 2, vargas: ["D2"] },
  { key: "home", house: 4, vargas: ["D4"] },
  { key: "education", house: 5, vargas: ["D24"] },
] as const;

function condition(c: ReturnType<typeof readingContext>[number]) {
  const support = ["Exalted", "Own Sign", "Moolatrikona"].includes(c.planet.dignity ?? "") || Boolean(c.strength?.isStrong);
  const pressure = c.combust || c.planet.dignity === "Debilitated" || Boolean(c.strength && !c.strength.isStrong);
  return support && pressure ? "mixed" : support ? "support" : pressure ? "pressure" : "unmarked";
}

/** Annual chart is a separate sidereal solar-return lens, not a replacement for natal promise.
 * Vimshottari is always taken from the natal chart, never from a chart cast at the return.
 */
export function annualReading(natal: KundaliChart, year: number, requestedAt?: Date) {
  const birthYear = DateTime.fromISO(natal.input.date).year;
  if (!Number.isInteger(year) || year < birthYear || year > 2100) throw new Error("Choose an annual year from the birth year through 2100.");
  const annual = computeVarshphal(natal.input, natal, year);
  const sun = natal.planets.find(p => p.planet === "Sun")!;
  const end = solarReturn(sun.siderealLongitude, new Date(natal.utcDate), year + 1);
  const at = requestedAt ?? annual.returnMoment;
  if (!Number.isFinite(at.getTime()) || at < annual.returnMoment || at >= end) throw new Error("The reading date must be within the selected solar-return year.");
  const chain = periodsAt(natal.dashas, at, 3);
  const positions = natal.planets.map(p => { const lon = siderealLongitude(p.planet, at); return { planet: p.planet, signIndex: Math.floor(lon / 30), degree: lon % 30 }; });
  const transits = positions.map(p => ({ ...p, sign: SIGNS[p.signIndex], houseFromLagna: ((p.signIndex - natal.ascendant.signIndex + 12) % 12) + 1, ...rawTransitModifiers(natal, p, positions) }));
  const periods = natal.dashas.flatMap(m => (m.subPeriods ?? []).map(a => ({ maha: m.lord, lord: a.lord, start: a.start, end: a.end })))
    .filter(p => new Date(p.end) > annual.returnMoment && new Date(p.start) < end);
  const areas = AREAS.map(area => {
    const base = readingContext(natal, [area.house], area.vargas as readonly VargaKey[], at)[0];
    const returned = readingContext(annual.chart, [area.house], [], at)[0];
    const natalTone = condition(base), annualTone = condition(returned);
    const related = new Set<PlanetName>([base.lord.lord, ...base.occupants.map(p => p.planet), ...base.aspects.map(p => p.planet)]);
    const activation = chain.filter(p => related.has(p.lord));
    const slowTransits = transits.filter(t => ["Jupiter", "Saturn"].includes(t.planet) && (t.houseFromLagna === area.house || getAspectedHouses(t.planet).includes(((area.house - t.houseFromLagna + 12) % 12) + 1)));
    return { ...area, natal: base, annual: returned, natalTone, annualTone, comparison: natalTone === "mixed" || annualTone === "mixed" ? "mixed" : natalTone === "unmarked" || annualTone === "unmarked" ? "limited" : natalTone === annualTone ? "agreement" : "different", activation, slowTransits };
  });
  return { annual, end, at, chain, periods, transits, areas };
}
export type AnnualReading = ReturnType<typeof annualReading>;
