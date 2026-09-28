import { DateTime } from "luxon";
import { NAKSHATRAS, SIGNS } from "./constants";
import { nakshatraLord } from "./dasha";
import { karanaIndex, karanaName, tithiIndex, tithiName, yogaIndex, yogaName } from "./birthDetails";
import { nextRiseSet, siderealSunMoon } from "./ephemeris";

/**
 * Daily Panchang for a place and civil date. Following the Vedic convention,
 * the day runs sunrise to sunrise, and each limb (tithi, nakshatra, yoga,
 * karana) is named as it stands at sunrise, with the moment it ends.
 */

const NAKSHATRA_SPAN = 360 / 27;
const MS_PER_HOUR = 3600_000;

export interface PanchangLimb {
  name: string;
  /** When this limb gives way to the next; null if it lasts past the search window. */
  endsAt: Date | null;
  next: string;
  detail?: string;
}

export interface TimeSpan {
  start: Date;
  end: Date;
}

export type ChoghadiyaName = "Amrit" | "Shubh" | "Labh" | "Char" | "Udveg" | "Kaal" | "Rog";

export interface ChoghadiyaSlot extends TimeSpan {
  name: ChoghadiyaName;
  quality: "Good" | "Neutral" | "Inauspicious";
}

export interface DailyPanchang {
  date: string; // YYYY-MM-DD, local to `timezone`
  timezone: string;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  moonrise: Date | null;
  moonset: Date | null;
  vara: { name: string; sanskrit: string };
  tithi: PanchangLimb & { paksha: "Shukla" | "Krishna" };
  nakshatra: PanchangLimb;
  yoga: PanchangLimb;
  karana: PanchangLimb;
  moonSign: PanchangLimb;
  sunSign: string;
  rahuKaal: TimeSpan;
  yamaganda: TimeSpan;
  gulikaKaal: TimeSpan;
  abhijit: TimeSpan;
  choghadiya: { day: ChoghadiyaSlot[]; night: ChoghadiyaSlot[] };
  /** Planetary hours: sunrise-to-sunset and sunset-to-sunrise each split into 12, ruled in Chaldean order from the weekday lord. */
  hora: { day: HoraSlot[]; night: HoraSlot[] };
}

export type HoraLord = "Sun" | "Venus" | "Mercury" | "Moon" | "Saturn" | "Jupiter" | "Mars";
export interface HoraSlot extends TimeSpan {
  lord: HoraLord;
}

const CHALDEAN: HoraLord[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const WEEKDAY_LORD: HoraLord[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

function horas(start: Date, end: Date, firstLord: HoraLord): HoraSlot[] {
  const len = (end.getTime() - start.getTime()) / 12;
  const first = CHALDEAN.indexOf(firstLord);
  return Array.from({ length: 12 }, (_, i) => ({
    lord: CHALDEAN[(first + i) % 7],
    start: new Date(start.getTime() + i * len),
    end: new Date(start.getTime() + (i + 1) * len),
  }));
}

/** The weekday lord rules the first hora at sunrise; the 13th hora (first of the night) follows on in the same sequence. */
export function computeHoras(sunrise: Date, sunset: Date, nextSunrise: Date, weekday: number): { day: HoraSlot[]; night: HoraSlot[] } {
  const firstDay = WEEKDAY_LORD[weekday];
  const firstNight = CHALDEAN[(CHALDEAN.indexOf(firstDay) + 12) % 7];
  return { day: horas(sunrise, sunset, firstDay), night: horas(sunset, nextSunrise, firstNight) };
}

const VARA_SANSKRIT = ["Ravivara", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara"];
const VARA_ENGLISH = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Which eighth of the daytime (1-based) each period occupies, indexed Sunday = 0.
const RAHU_KAAL_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];

const DAY_CHOGHADIYA_CYCLE: ChoghadiyaName[] = ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"];
const NIGHT_CHOGHADIYA_CYCLE: ChoghadiyaName[] = ["Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg"];
// First choghadiya of the day / night, indexed Sunday = 0.
const DAY_CHOGHADIYA_START: ChoghadiyaName[] = ["Udveg", "Amrit", "Rog", "Labh", "Shubh", "Char", "Kaal"];
const NIGHT_CHOGHADIYA_START: ChoghadiyaName[] = ["Shubh", "Char", "Kaal", "Udveg", "Amrit", "Rog", "Labh"];

const CHOGHADIYA_QUALITY: Record<ChoghadiyaName, ChoghadiyaSlot["quality"]> = {
  Amrit: "Good",
  Shubh: "Good",
  Labh: "Good",
  Char: "Neutral",
  Udveg: "Inauspicious",
  Kaal: "Inauspicious",
  Rog: "Inauspicious",
};

type IndexFn = (date: Date) => number;

/**
 * First moment after `from` at which `indexAt` changes, to within a minute:
 * steps forward an hour at a time (every limb lasts well over an hour), then
 * bisects the bracketing hour.
 */
export function findChange(indexAt: IndexFn, from: Date, maxHours = 48): Date | null {
  const start = indexAt(from);
  let lo = from.getTime();
  for (let h = 1; h <= maxHours; h++) {
    const hi = from.getTime() + h * MS_PER_HOUR;
    if (indexAt(new Date(hi)) !== start) {
      let a = lo;
      let b = hi;
      while (b - a > 30_000) {
        const mid = (a + b) / 2;
        if (indexAt(new Date(mid)) === start) a = mid;
        else b = mid;
      }
      return new Date(b);
    }
    lo = hi;
  }
  return null;
}

function limb(indexAt: IndexFn, at: Date, nameOf: (i: number) => string, cycle: number): PanchangLimb {
  const i = indexAt(at);
  return { name: nameOf(i), endsAt: findChange(indexAt, at), next: nameOf((i + 1) % cycle) };
}

function eighth(sunrise: Date, sunset: Date, part: number): TimeSpan {
  const len = (sunset.getTime() - sunrise.getTime()) / 8;
  return { start: new Date(sunrise.getTime() + (part - 1) * len), end: new Date(sunrise.getTime() + part * len) };
}

function choghadiyas(start: Date, end: Date, first: ChoghadiyaName, cycle: ChoghadiyaName[]): ChoghadiyaSlot[] {
  const len = (end.getTime() - start.getTime()) / 8;
  const offset = cycle.indexOf(first);
  return Array.from({ length: 8 }, (_, i) => {
    const name = cycle[(offset + i) % 7];
    return {
      name,
      quality: CHOGHADIYA_QUALITY[name],
      start: new Date(start.getTime() + i * len),
      end: new Date(start.getTime() + (i + 1) * len),
    };
  });
}

export function computeDailyPanchang(date: string, latitude: number, longitude: number, timezone: string): DailyPanchang {
  const midnight = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  if (!midnight.isValid) throw new Error(`Invalid date or timezone: ${midnight.invalidReason}`);

  const sunrise = nextRiseSet("Sun", 1, midnight.toJSDate(), latitude, longitude);
  const sunset = sunrise && nextRiseSet("Sun", -1, sunrise, latitude, longitude);
  const nextSunrise = sunset && nextRiseSet("Sun", 1, sunset, latitude, longitude);
  if (!sunrise || !sunset || !nextSunrise) {
    throw new Error("The Sun does not rise and set at this latitude on this date, so a Panchang cannot be drawn up.");
  }

  const moonrise = nextRiseSet("Moon", 1, midnight.toJSDate(), latitude, longitude);
  const moonset = nextRiseSet("Moon", -1, midnight.toJSDate(), latitude, longitude);

  const sm = (d: Date) => siderealSunMoon(d);
  const tithiAt: IndexFn = (d) => {
    const p = sm(d);
    return tithiIndex(p.sun, p.moon);
  };
  const nakshatraAt: IndexFn = (d) => Math.floor(sm(d).moon / NAKSHATRA_SPAN);
  const yogaAt: IndexFn = (d) => {
    const p = sm(d);
    return yogaIndex(p.sun, p.moon);
  };
  const karanaAt: IndexFn = (d) => {
    const p = sm(d);
    return karanaIndex(p.sun, p.moon);
  };
  const moonSignAt: IndexFn = (d) => Math.floor(sm(d).moon / 30);

  const weekday = midnight.weekday % 7; // luxon: Monday = 1 … Sunday = 7 → Sunday = 0
  const tithiNow = tithiAt(sunrise);
  const nakshatraNow = nakshatraAt(sunrise);
  const dayLength = sunset.getTime() - sunrise.getTime();
  const muhurta = dayLength / 15;

  return {
    date: midnight.toISODate()!,
    timezone,
    sunrise,
    sunset,
    nextSunrise,
    moonrise,
    moonset,
    vara: { name: VARA_ENGLISH[weekday], sanskrit: VARA_SANSKRIT[weekday] },
    tithi: {
      ...limb(tithiAt, sunrise, (i) => formatTithi(i), 30),
      paksha: tithiName(tithiNow).paksha,
    },
    nakshatra: {
      ...limb(nakshatraAt, sunrise, (i) => NAKSHATRAS[i], 27),
      detail: `Lord ${nakshatraLord(nakshatraNow)}`,
    },
    yoga: limb(yogaAt, sunrise, yogaName, 27),
    karana: limb(karanaAt, sunrise, karanaName, 60),
    moonSign: limb(moonSignAt, sunrise, (i) => SIGNS[i], 12),
    sunSign: SIGNS[Math.floor(sm(sunrise).sun / 30)],
    rahuKaal: eighth(sunrise, sunset, RAHU_KAAL_PART[weekday]),
    yamaganda: eighth(sunrise, sunset, YAMAGANDA_PART[weekday]),
    gulikaKaal: eighth(sunrise, sunset, GULIKA_PART[weekday]),
    // The 8th of the day's 15 muhurtas, centred on local noon.
    abhijit: { start: new Date(sunrise.getTime() + 7 * muhurta), end: new Date(sunrise.getTime() + 8 * muhurta) },
    choghadiya: {
      day: choghadiyas(sunrise, sunset, DAY_CHOGHADIYA_START[weekday], DAY_CHOGHADIYA_CYCLE),
      night: choghadiyas(sunset, nextSunrise, NIGHT_CHOGHADIYA_START[weekday], NIGHT_CHOGHADIYA_CYCLE),
    },
    hora: computeHoras(sunrise, sunset, nextSunrise, weekday),
  };
}

function formatTithi(index: number): string {
  const { tithi, paksha } = tithiName(index);
  return `${paksha} ${tithi}`;
}
