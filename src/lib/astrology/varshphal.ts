import { DateTime } from "luxon";
import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { siderealLongitude } from "./ephemeris";
import { calculateKundali } from "./kundali";
import { normalizeDegrees, signOffsetHouse } from "./math";
import type { BirthInput, KundaliChart } from "./types";

/**
 * Varshphal (Tajik annual chart): the chart cast for the moment the Sun
 * returns to its exact natal sidereal longitude each year, plus the Muntha —
 * a point that starts at the natal Lagna and advances one sign per year.
 */

export interface Varshphal {
  year: number;
  age: number;
  returnMoment: Date;
  localReturn: string; // "YYYY-MM-DD HH:mm" at the birth place
  chart: KundaliChart;
  muntha: { signIndex: number; sign: string; lord: PlanetName; house: number; verdict: "Excellent" | "Good" | "Challenging"; text: string };
}

/** Moment in `year` when the Sun's sidereal longitude equals `natalSun`. */
export function solarReturn(natalSun: number, birth: Date, year: number): Date {
  const approx = DateTime.fromJSDate(birth, { zone: "utc" }).set({ year }).toMillis();
  // The Sun moves ~1°/day, so the return lies within a few days of the birthday; bisect on the signed gap.
  const gap = (t: number) => ((normalizeDegrees(siderealLongitude("Sun", new Date(t)) - natalSun) + 180) % 360) - 180;
  let lo = approx - 4 * 86400_000;
  let hi = approx + 4 * 86400_000;
  for (let i = 0; i < 50 && hi - lo > 1000; i++) {
    const mid = (lo + hi) / 2;
    if (gap(mid) < 0) lo = mid;
    else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

const MUNTHA_EXCELLENT = new Set([9, 10, 11]);
const MUNTHA_GOOD = new Set([1, 2, 3, 5]);

export function computeVarshphal(input: BirthInput, natal: KundaliChart, year: number): Varshphal {
  const birth = new Date(natal.utcDate);
  const natalSun = natal.planets.find((p) => p.planet === "Sun")!.siderealLongitude;
  const returnMoment = solarReturn(natalSun, birth, year);
  const local = DateTime.fromJSDate(returnMoment, { zone: input.timezone });
  const chart = calculateKundali({ ...input, date: local.toISODate()!, time: local.toFormat("HH:mm") });

  const age = year - DateTime.fromJSDate(birth, { zone: input.timezone }).year;
  const munthaSign = (natal.ascendant.signIndex + age) % 12;
  const house = signOffsetHouse(munthaSign, chart.ascendant.signIndex);
  const verdict = MUNTHA_EXCELLENT.has(house) ? "Excellent" : MUNTHA_GOOD.has(house) ? "Good" : "Challenging";
  const lord = SIGN_LORDS[munthaSign];

  return {
    year,
    age,
    returnMoment,
    localReturn: local.toFormat("yyyy-LL-dd HH:mm"),
    chart,
    muntha: {
      signIndex: munthaSign,
      sign: SIGNS[munthaSign],
      lord,
      house,
      verdict,
      text:
        verdict === "Excellent"
          ? `The Muntha falls in the ${house}th house of the annual chart — one of its best positions, promising success, recognition and gains this year, especially through the matters of that house.`
          : verdict === "Good"
            ? `The Muntha falls in the ${house === 1 ? "1st" : house === 2 ? "2nd" : house === 3 ? "3rd" : "5th"} house of the annual chart — a supportive position for health, effort and steady progress this year.`
            : `The Muntha falls in the ${house === 4 ? "4th" : `${house}th`} house of the annual chart — a position that asks for care this year; its lord ${lord}'s condition shows how much.`,
    },
  };
}
