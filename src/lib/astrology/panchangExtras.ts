import { DateTime } from "luxon";
import { NAKSHATRAS, SIGNS } from "./constants";
import { karanaIndex, karanaName, tithiIndex } from "./birthDetails";
import { computeAscendantAndMidheaven, siderealSunMoon } from "./ephemeris";
import { lahiriAyanamsa } from "./ayanamsa";
import { normalizeDegrees } from "./math";
import { findChange, type DailyPanchang, type TimeSpan } from "./panchang";

/**
 * The finer layer of the Panchang that almanacs such as Drik Panchang print:
 * Panchaka, Ganda Moola, Bhadra (Vishti karana), Vinchudo, the special yogas
 * made by weekday + nakshatra (+ tithi), Durmuhurtam, Varjyam (Tyajyam),
 * Amrit Kaal, Brahma Muhurta, Udaya Lagna and Tamil Gowri Panchangam.
 * All are computed for the Vedic day — sunrise to next sunrise.
 */

const NAK = 360 / 27;
const HOUR = 3600_000;

export interface Segment<T> extends TimeSpan {
  value: T;
}

export interface SpecialYoga extends TimeSpan {
  name: string;
  nature: "Auspicious" | "Inauspicious";
  meaning: string;
}

export interface GowriSlot extends TimeSpan {
  name: GowriName;
  good: boolean;
}

export type GowriName = "Amirdha" | "Uthi" | "Laabam" | "Dhanam" | "Sugam" | "Rogam" | "Soram" | "Visham";

export interface PanchangExtras {
  brahmaMuhurta: TimeSpan;
  durmuhurtam: TimeSpan[];
  varjyam: TimeSpan[];
  amritKaal: TimeSpan[];
  panchaka: (TimeSpan & { kind: string }) | null;
  gandaMoola: (TimeSpan & { nakshatra: string }) | null;
  bhadra: (TimeSpan & { residence: string; harmful: boolean })[];
  vinchudo: TimeSpan | null;
  specialYogas: SpecialYoga[];
  udayaLagna: Segment<string>[];
  gowri: { day: GowriSlot[]; night: GowriSlot[] };
}

type IndexFn = (d: Date) => number;

/** The index `fn` has at `from` and when it began, searching back up to `maxHours`. */
function findPreviousChange(fn: IndexFn, from: Date, maxHours = 40): Date {
  const v = fn(from);
  let hi = from.getTime();
  for (let h = 1; h <= maxHours; h++) {
    const lo = from.getTime() - h * HOUR;
    if (fn(new Date(lo)) !== v) {
      let a = lo;
      let b = hi;
      while (b - a > 30_000) {
        const mid = (a + b) / 2;
        if (fn(new Date(mid)) === v) b = mid;
        else a = mid;
      }
      return new Date(b);
    }
    hi = lo;
  }
  return new Date(from.getTime() - maxHours * HOUR);
}

/** Consecutive runs of `fn`'s value covering [from, to], each with its true start and end. */
export function segments(fn: IndexFn, from: Date, to: Date): Segment<number>[] {
  const out: Segment<number>[] = [];
  let start = findPreviousChange(fn, from);
  let cursor = from;
  while (cursor < to) {
    const value = fn(cursor);
    const end = findChange(fn, cursor, 40) ?? new Date(cursor.getTime() + 40 * HOUR);
    out.push({ value, start, end });
    start = end;
    cursor = new Date(end.getTime() + 1000);
  }
  return out;
}

const clip = (s: TimeSpan, a: Date, b: Date): TimeSpan | null => {
  const start = Math.max(s.start.getTime(), a.getTime());
  const end = Math.min(s.end.getTime(), b.getTime());
  return end > start ? { start: new Date(start), end: new Date(end) } : null;
};

// Tyajyam (Varjyam) and Amrit Kaal start, in ghatis (of 60) after the nakshatra begins; each lasts 4 ghatis.
const VARJYAM_GHATI = [50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 20, 14, 14, 10, 14, 56, 24, 20, 10, 10, 18, 16, 24, 30];
const AMRIT_GHATI = [42, 48, 54, 52, 38, 35, 54, 44, 56, 54, 44, 42, 45, 44, 38, 38, 34, 38, 44, 48, 44, 34, 34, 42, 40, 48, 54];

// Durmuhurtam: which of the fifteen day muhurtas (negative = night muhurta) are avoided, Sunday = 0.
const DURMUHURTA: number[][] = [[14], [9, 12], [4, -7], [8], [6, 12], [4, 9], [1, 2]];

// Nakshatra indices (0 = Ashwini).
const N = Object.fromEntries(NAKSHATRAS.map((n, i) => [n, i])) as Record<string, number>;
const SARVARTHA: number[][] = [
  ["Ashwini", "Pushya", "Uttara Phalguni", "Hasta", "Mula", "Uttara Ashadha", "Uttara Bhadrapada"],
  ["Rohini", "Mrigashira", "Pushya", "Anuradha", "Shravana"],
  ["Ashwini", "Krittika", "Ashlesha", "Uttara Bhadrapada"],
  ["Krittika", "Rohini", "Mrigashira", "Hasta", "Anuradha"],
  ["Ashwini", "Punarvasu", "Pushya", "Anuradha", "Revati"],
  ["Ashwini", "Punarvasu", "Anuradha", "Shravana", "Revati"],
  ["Rohini", "Swati", "Shravana"],
].map((l) => l.map((n) => N[n]).filter((x) => x !== undefined));
const AMRITA_SIDDHI = ["Hasta", "Mrigashira", "Ashwini", "Anuradha", "Pushya", "Revati", "Rohini"].map((n) => N[n]);
const DWIPUSHKAR = ["Mrigashira", "Chitra", "Dhanishta"].map((n) => N[n]);
const TRIPUSHKAR = ["Krittika", "Punarvasu", "Uttara Phalguni", "Vishakha", "Uttara Ashadha", "Purva Bhadrapada"].map((n) => N[n]);
const GANDA_MOOLA = new Set(["Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Mula", "Revati"].map((n) => N[n]));
const PANCHAKA_KIND = ["Roga Panchaka", "Raja Panchaka", "Agni Panchaka", "Panchaka", "Panchaka", "Chora Panchaka", "Mrityu Panchaka"];

// Tamil Gowri Panchangam order for each weekday (Sunday = 0), day and night, as printed by Drik Panchang.
const GOWRI_DAY: GowriName[][] = [
  ["Uthi", "Amirdha", "Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Visham"],
  ["Amirdha", "Visham", "Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Uthi"],
  ["Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Uthi", "Visham", "Amirdha"],
  ["Laabam", "Dhanam", "Sugam", "Soram", "Visham", "Uthi", "Amirdha", "Rogam"],
  ["Dhanam", "Sugam", "Soram", "Uthi", "Amirdha", "Visham", "Rogam", "Laabam"],
  ["Sugam", "Soram", "Uthi", "Visham", "Amirdha", "Rogam", "Laabam", "Dhanam"],
  ["Soram", "Uthi", "Visham", "Amirdha", "Rogam", "Laabam", "Dhanam", "Sugam"],
];
const GOWRI_NIGHT: GowriName[][] = [
  ["Dhanam", "Sugam", "Soram", "Visham", "Uthi", "Amirdha", "Rogam", "Laabam"],
  ["Sugam", "Soram", "Uthi", "Amirdha", "Visham", "Rogam", "Laabam", "Dhanam"],
  ["Soram", "Uthi", "Visham", "Amirdha", "Rogam", "Laabam", "Dhanam", "Sugam"],
  ["Uthi", "Amirdha", "Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Visham"],
  ["Amirdha", "Visham", "Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Uthi"],
  ["Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Uthi", "Visham", "Amirdha"],
  ["Laabam", "Dhanam", "Sugam", "Soram", "Uthi", "Visham", "Amirdha", "Rogam"],
];
const GOWRI_GOOD = new Set<GowriName>(["Amirdha", "Uthi", "Laabam", "Dhanam", "Sugam"]);

function eightParts(start: Date, end: Date, names: GowriName[]): GowriSlot[] {
  const len = (end.getTime() - start.getTime()) / 8;
  return names.map((name, i) => ({ name, good: GOWRI_GOOD.has(name), start: new Date(start.getTime() + i * len), end: new Date(start.getTime() + (i + 1) * len) }));
}

export function computePanchangExtras(p: DailyPanchang, latitude: number, longitude: number): PanchangExtras {
  const { sunrise, sunset, nextSunrise } = p;
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(p.vara.name);
  const sm = (d: Date) => siderealSunMoon(d);
  const nakAt: IndexFn = (d) => Math.floor(sm(d).moon / NAK);
  const tithiAt: IndexFn = (d) => {
    const x = sm(d);
    return tithiIndex(x.sun, x.moon);
  };
  const karanaAt: IndexFn = (d) => {
    const x = sm(d);
    return karanaIndex(x.sun, x.moon);
  };
  const moonSignAt: IndexFn = (d) => Math.floor(sm(d).moon / 30);
  const panchakaAt: IndexFn = (d) => (sm(d).moon >= 300 ? 1 : 0);

  const naks = segments(nakAt, sunrise, nextSunrise);

  // Brahma Muhurta: the two muhurtas (48 minutes each) before sunrise, the first of them.
  const brahmaMuhurta = { start: new Date(sunrise.getTime() - 96 * 60_000), end: new Date(sunrise.getTime() - 48 * 60_000) };

  const dayMuh = (sunset.getTime() - sunrise.getTime()) / 15;
  const nightMuh = (nextSunrise.getTime() - sunset.getTime()) / 15;
  const durmuhurtam = DURMUHURTA[weekday].map((n) =>
    n > 0 ? { start: new Date(sunrise.getTime() + (n - 1) * dayMuh), end: new Date(sunrise.getTime() + n * dayMuh) } : { start: new Date(sunset.getTime() + (-n - 1) * nightMuh), end: new Date(sunset.getTime() + -n * nightMuh) }
  );

  const window = (table: number[]) =>
    naks
      .map((s) => {
        const len = s.end.getTime() - s.start.getTime();
        const start = s.start.getTime() + (table[s.value] / 60) * len;
        return clip({ start: new Date(start), end: new Date(start + (4 / 60) * len) }, sunrise, nextSunrise);
      })
      .filter((x): x is TimeSpan => !!x);

  const pk = segments(panchakaAt, sunrise, nextSunrise).find((s) => s.value === 1);
  const panchakaStart = pk ? findPreviousChange(panchakaAt, new Date(Math.max(pk.start.getTime(), sunrise.getTime()) + 1000), 24 * 3) : null;
  const panchakaWeekday = panchakaStart ? DateTime.fromJSDate(panchakaStart, { zone: p.timezone }).weekday % 7 : weekday;
  const panchaka = pk ? { ...clip(pk, sunrise, nextSunrise)!, kind: PANCHAKA_KIND[panchakaWeekday] } : null;

  const gm = naks.filter((s) => GANDA_MOOLA.has(s.value));
  const gandaMoola = gm.length ? { ...clip({ start: gm[0].start, end: gm[gm.length - 1].end }, sunrise, nextSunrise)!, nakshatra: gm.map((s) => NAKSHATRAS[s.value]).join(", ") } : null;

  const bhadra = segments(karanaAt, sunrise, nextSunrise)
    .filter((s) => karanaName(s.value) === "Vishti")
    .map((s) => {
      const moonSign = moonSignAt(new Date((s.start.getTime() + s.end.getTime()) / 2));
      const residence = [3, 4, 10, 11].includes(moonSign) ? "Earth (Bhuloka)" : [0, 1, 2, 7].includes(moonSign) ? "Heaven (Swarga)" : "Netherworld (Patala)";
      return { ...clip(s, sunrise, nextSunrise)!, residence, harmful: residence.startsWith("Earth") };
    })
    .filter((b) => b.start);

  const vs = segments(moonSignAt, sunrise, nextSunrise).find((s) => s.value === 7);
  const vinchudo = vs ? clip(vs, sunrise, nextSunrise) : null;

  // Special yogas: weekday (sunrise to sunrise) combined with nakshatra, and for Pushkar yogas the tithi.
  const specialYogas: SpecialYoga[] = [];
  const addFor = (list: number[], name: string, meaning: string, nature: SpecialYoga["nature"] = "Auspicious") => {
    for (const s of naks) if (list.includes(s.value)) {
      const c = clip(s, sunrise, nextSunrise);
      if (c) specialYogas.push({ name, meaning, nature, ...c });
    }
  };
  addFor(SARVARTHA[weekday], "Sarvartha Siddhi Yoga", "Success in all undertakings — good for starting important work.");
  addFor([AMRITA_SIDDHI[weekday]], "Amrita Siddhi Yoga", "Highly auspicious; favours new ventures (avoid marriage and travel on some combinations by tradition).");
  if (weekday === 4) addFor([N["Pushya"]], "Guru Pushya Yoga", "Excellent for buying gold, property and starting studies.");
  if (weekday === 0) addFor([N["Pushya"]], "Ravi Pushya Yoga", "Excellent for purchases, medicine and initiations.");
  // Ravi Yoga: Moon's nakshatra is the 4th, 6th, 9th, 10th, 13th or 20th from the Sun's.
  for (const s of naks) {
    const sunNak = Math.floor(sm(new Date(Math.max(s.start.getTime(), sunrise.getTime()))).sun / NAK);
    const count = ((s.value - sunNak + 27) % 27) + 1;
    if ([4, 6, 9, 10, 13, 20].includes(count)) {
      const c = clip(s, sunrise, nextSunrise);
      if (c) specialYogas.push({ name: "Ravi Yoga", nature: "Auspicious", meaning: "The Sun's strength removes many doshas — good for important work.", ...c });
    }
  }
  if ([0, 2, 6].includes(weekday)) {
    const tithis = segments(tithiAt, sunrise, nextSunrise).filter((t) => [1, 6, 11].includes(t.value % 15)); // Dwitiya, Saptami, Dwadashi
    for (const t of tithis)
      for (const s of naks) {
        const both = clip(t, s.start, s.end);
        const c = both && clip(both, sunrise, nextSunrise);
        if (!c) continue;
        if (DWIPUSHKAR.includes(s.value)) specialYogas.push({ name: "Dwipushkar Yoga", nature: "Auspicious", meaning: "Whatever is done now repeats twice — good for gains, avoid losses and bad deeds.", ...c });
        if (TRIPUSHKAR.includes(s.value)) specialYogas.push({ name: "Tripushkar Yoga", nature: "Auspicious", meaning: "Whatever is done now repeats three times — good for investment, avoid losses.", ...c });
      }
  }
  specialYogas.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Udaya Lagna: the rising sign through the day.
  const lagnaAt: IndexFn = (d) => Math.floor(normalizeDegrees(computeAscendantAndMidheaven(d, latitude, longitude).ascendant - lahiriAyanamsa(d)) / 30);
  const udayaLagna = segments(lagnaAt, sunrise, nextSunrise).map((s) => ({ value: SIGNS[s.value], ...clip(s, sunrise, nextSunrise)! }));

  return {
    brahmaMuhurta,
    durmuhurtam,
    varjyam: window(VARJYAM_GHATI),
    amritKaal: window(AMRIT_GHATI),
    panchaka,
    gandaMoola,
    bhadra,
    vinchudo,
    specialYogas,
    udayaLagna,
    gowri: { day: eightParts(sunrise, sunset, GOWRI_DAY[weekday]), night: eightParts(sunset, nextSunrise, GOWRI_NIGHT[weekday]) },
  };
}
