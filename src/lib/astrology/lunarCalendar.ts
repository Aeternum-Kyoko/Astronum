import * as Astronomy from "astronomy-engine";
import { DateTime } from "luxon";
import { lahiriAyanamsa } from "./ayanamsa";
import { normalizeDegrees } from "./math";
import { nextRiseSet, siderealSunMoon } from "./ephemeris";

/**
 * The Hindu lunisolar calendar (amanta convention: months run new Moon to new
 * Moon). A month is named by the sidereal sign the Sun occupies at the new Moon
 * that opens it — Sun in Pisces opens Chaitra — and a month with no solar
 * ingress (two new Moons in the same sign) is an adhika (extra) month.
 */

export const LUNAR_MONTHS = [
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashwin",
  "Kartika",
  "Margashirsha",
  "Pausha",
  "Magha",
  "Phalguna",
] as const;
export type LunarMonth = (typeof LUNAR_MONTHS)[number];

export interface LunarMonthSpan {
  name: LunarMonth;
  adhika: boolean;
  start: Date; // new Moon
  end: Date; // next new Moon
}

function sunSignAt(date: Date): number {
  return Math.floor(siderealSunMoon(date).sun / 30);
}

/** Every lunar month overlapping [from, to]. */
export function lunarMonthsBetween(from: Date, to: Date): LunarMonthSpan[] {
  // New Moons from one before `from` through the first one after `to`.
  const newMoons: Date[] = [];
  let t = Astronomy.SearchMoonPhase(0, new Date(from.getTime() - 32 * 86400_000), 40)!.date;
  for (;;) {
    newMoons.push(t);
    if (t > to) break;
    t = Astronomy.SearchMoonPhase(0, new Date(t.getTime() + 86400_000), 40)!.date;
  }

  const months: LunarMonthSpan[] = [];
  for (let i = 0; i < newMoons.length - 1; i++) {
    const sign = sunSignAt(newMoons[i]);
    const nextSign = sunSignAt(newMoons[i + 1]);
    months.push({
      name: LUNAR_MONTHS[(sign + 1) % 12],
      adhika: sign === nextSign,
      start: newMoons[i],
      end: newMoons[i + 1],
    });
  }
  return months.filter((m) => m.end >= from && m.start <= to);
}

/** Start and end of tithi `index` (0 = Shukla Pratipada … 29 = Amavasya) within the month opening at `monthStart`. */
export function tithiSpan(monthStart: Date, index: number): { start: Date; end: Date } {
  const start = index === 0 ? monthStart : Astronomy.SearchMoonPhase(index * 12, monthStart, 32)!.date;
  const end = Astronomy.SearchMoonPhase(((index + 1) * 12) % 360, start, 3)!.date;
  return { start, end };
}

/** Moment the Sun enters sidereal sign `signIndex`, searching forward from `after`. */
export function sankranti(signIndex: number, after: Date): Date {
  let guess = after;
  // The ayanamsa drifts ~50″ a year, so re-solve once with the value at the first estimate.
  for (let i = 0; i < 2; i++) {
    const tropical = normalizeDegrees(signIndex * 30 + lahiriAyanamsa(guess));
    guess = Astronomy.SearchSunLongitude(tropical, after, 370)!.date;
  }
  return guess;
}

export interface DayTimes {
  date: string;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  moonrise: Date | null;
}

export function localDayTimes(date: string, latitude: number, longitude: number, timezone: string): DayTimes {
  const midnight = DateTime.fromISO(date, { zone: timezone }).startOf("day").toJSDate();
  const sunrise = nextRiseSet("Sun", 1, midnight, latitude, longitude)!;
  const sunset = nextRiseSet("Sun", -1, sunrise, latitude, longitude)!;
  const nextSunrise = nextRiseSet("Sun", 1, sunset, latitude, longitude)!;
  const moonrise = nextRiseSet("Moon", 1, midnight, latitude, longitude);
  return { date, sunrise, sunset, nextSunrise, moonrise };
}

export function localDate(d: Date, timezone: string): string {
  return DateTime.fromJSDate(d, { zone: timezone }).toISODate()!;
}

export function addDays(date: string, days: number): string {
  return DateTime.fromISO(date).plus({ days }).toISODate()!;
}
