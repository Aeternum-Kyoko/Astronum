import { DateTime } from "luxon";
import { NAKSHATRAS, PLANETS, SIGNS, SIGN_SANSKRIT, type PlanetName, type SignName } from "./constants";
import { lahiriAyanamsa } from "./ayanamsa";
import { computeRawPositions, isRetrograde, siderealSunMoon } from "./ephemeris";
import { normalizeDegrees, signOffsetHouse } from "./math";
import { findChange } from "./panchang";
import { horoscopeText, type SaturnKind } from "./horoscopeText";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Daily horoscope by Moon sign (rashi), read by classical gochara: each
 * transiting planet's house counted from the reader's natal Moon sign. The
 * Moon's transit sets the day's tone; Jupiter and Saturn — which stay in a
 * sign for a year and ~2½ years — set the longer backdrop.
 */

export const SIGN_SLUGS = SIGNS.map((s) => s.toLowerCase());

export function signFromSlug(slug: string): number | null {
  const i = SIGN_SLUGS.indexOf(slug.toLowerCase());
  return i === -1 ? null : i;
}

/** The day is read from 6 AM local time, when most readers start it. */
const DAY_START_HOUR = 6;

export interface DailyTransits {
  date: string;
  timezone: string;
  moonSignIndex: number;
  moonNakshatra: string;
  /** When the Moon enters the next sign before the day ends (local midnight), if it does. */
  moonChange: { at: Date; signIndex: number } | null;
  jupiterSignIndex: number;
  saturnSignIndex: number;
  /** All nine grahas at the start of the day, for the rashi chart and the "why" breakdown. */
  positions: { planet: PlanetName; longitude: number; signIndex: number; retrograde: boolean }[];
}

export type DayTone = "Favourable" | "Mixed" | "Challenging";

export interface SignHoroscope {
  sign: SignName;
  slug: string;
  sanskrit: string;
  moonHouse: number;
  tone: DayTone;
  /** 1–5 */
  rating: number;
  headline: string;
  reading: string;
  focus: string;
  laterInDay: { at: Date; house: number; headline: string } | null;
  jupiter: { house: number; favourable: boolean; text: string };
  saturn: { house: number; kind: SaturnKind; status: string; text: string };
  /** How the star rating was reached, for the "why this reading" panel. */
  ratingParts: { moonPoints: number; jupiterPoint: number; saturnPoint: number; cappedByChandrashtama: boolean };
}

const MOON_FAVOURABLE = new Set([1, 3, 6, 7, 10, 11]);
const MOON_CHALLENGING = new Set([4, 8, 12]);
const JUPITER_FAVOURABLE = new Set([2, 5, 7, 9, 11]);
const SATURN_FAVOURABLE = new Set([3, 6, 11]);




function moonTone(house: number): DayTone {
  return MOON_FAVOURABLE.has(house) ? "Favourable" : MOON_CHALLENGING.has(house) ? "Challenging" : "Mixed";
}

export function computeDailyTransits(date: string, timezone = "Asia/Kolkata"): DailyTransits {
  const day = DateTime.fromISO(date, { zone: timezone });
  if (!day.isValid) throw new Error(`Invalid date or timezone: ${day.invalidReason}`);
  const start = day.set({ hour: DAY_START_HOUR, minute: 0, second: 0, millisecond: 0 }).toJSDate();
  const endOfDay = day.endOf("day").toJSDate();

  const moonSignAt = (d: Date) => Math.floor(siderealSunMoon(d).moon / 30);
  const moonLon = siderealSunMoon(start).moon;
  const moonSignIndex = Math.floor(moonLon / 30);
  const hoursLeft = (endOfDay.getTime() - start.getTime()) / 3600_000;
  const changeAt = findChange(moonSignAt, start, Math.ceil(hoursLeft));
  const moonChange = changeAt && changeAt <= endOfDay ? { at: changeAt, signIndex: (moonSignIndex + 1) % 12 } : null;

  const ayanamsa = lahiriAyanamsa(start);
  const raw = computeRawPositions(start);
  const siderealSign = (planet: string) => Math.floor(normalizeDegrees(raw.tropicalLongitudes[planet] - ayanamsa) / 30);
  const positions = PLANETS.map((planet) => {
    const longitude = normalizeDegrees(raw.tropicalLongitudes[planet] - ayanamsa);
    const retrograde =
      planet === "Rahu" || planet === "Ketu" ? true : planet === "Sun" || planet === "Moon" ? false : isRetrograde(planet, start);
    return { planet, longitude, signIndex: Math.floor(longitude / 30), retrograde };
  });

  return {
    date: day.toISODate()!,
    timezone,
    moonSignIndex,
    moonNakshatra: NAKSHATRAS[Math.floor(moonLon / (360 / 27))],
    moonChange,
    jupiterSignIndex: siderealSign("Jupiter"),
    saturnSignIndex: siderealSign("Saturn"),
    positions,
  };
}

function saturnKind(house: number): SaturnKind {
  if (house === 12) return "sadeSatiRising";
  if (house === 1) return "sadeSatiPeak";
  if (house === 2) return "sadeSatiSetting";
  if (house === 4) return "kantaka";
  if (house === 8) return "ashtama";
  return SATURN_FAVOURABLE.has(house) ? "favourable" : "neutral";
}

export function horoscopeForSign(signIndex: number, t: DailyTransits, locale: Locale = "en"): SignHoroscope {
  const text = horoscopeText(locale);
  const moonHouse = signOffsetHouse(t.moonSignIndex, signIndex);
  const jupiterHouse = signOffsetHouse(t.jupiterSignIndex, signIndex);
  const saturnHouse = signOffsetHouse(t.saturnSignIndex, signIndex);
  const tone = moonTone(moonHouse);

  // Moon sets the base (0–2), each supportive slow planet adds a point; Chandrashtama caps the day at 2 stars.
  const moonPoints = tone === "Favourable" ? 2 : tone === "Mixed" ? 1 : 0;
  const jupiterPoint = JUPITER_FAVOURABLE.has(jupiterHouse) ? 1 : 0;
  const saturnPoint = SATURN_FAVOURABLE.has(saturnHouse) ? 1 : 0;
  let rating = 1 + moonPoints + jupiterPoint + saturnPoint;
  const cappedByChandrashtama = moonHouse === 8 && rating > 2;
  if (moonHouse === 8) rating = Math.min(rating, 2);

  const laterHouse = t.moonChange ? signOffsetHouse(t.moonChange.signIndex, signIndex) : null;

  return {
    sign: SIGNS[signIndex],
    slug: SIGN_SLUGS[signIndex],
    sanskrit: SIGN_SANSKRIT[signIndex],
    moonHouse,
    tone,
    rating,
    headline: text.moonHeadline[moonHouse],
    reading: text.moonReading[moonHouse],
    focus: text.focus[moonHouse],
    laterInDay: t.moonChange && laterHouse ? { at: t.moonChange.at, house: laterHouse, headline: text.moonHeadline[laterHouse] } : null,
    jupiter: { house: jupiterHouse, favourable: JUPITER_FAVOURABLE.has(jupiterHouse), text: text.jupiter[jupiterHouse] },
    saturn: { house: saturnHouse, kind: saturnKind(saturnHouse), status: text.saturnStatus[saturnKind(saturnHouse)], text: text.saturnText(saturnKind(saturnHouse), saturnHouse) },
    ratingParts: { moonPoints, jupiterPoint, saturnPoint, cappedByChandrashtama },
  };
}


/** Resolves "yesterday" / "today" / "tomorrow" (or a YYYY-MM-DD string) to a local date. */
export function resolveHoroscopeDay(day: string | undefined, timezone = "Asia/Kolkata", now = new Date()): { date: string; label: "Yesterday" | "Today" | "Tomorrow" | null } {
  const today = DateTime.fromJSDate(now, { zone: timezone }).startOf("day");
  const offsets = { yesterday: -1, today: 0, tomorrow: 1 } as const;
  if (!day || day in offsets) {
    const key = (day ?? "today") as keyof typeof offsets;
    const label = (key[0].toUpperCase() + key.slice(1)) as "Yesterday" | "Today" | "Tomorrow";
    return { date: today.plus({ days: offsets[key] }).toISODate()!, label };
  }
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(day) ? DateTime.fromISO(day, { zone: timezone }) : null;
  if (!parsed?.isValid) return { date: today.toISODate()!, label: "Today" };
  const diff = Math.round(parsed.diff(today, "days").days);
  const label = diff === -1 ? "Yesterday" : diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : null;
  return { date: parsed.toISODate()!, label };
}
