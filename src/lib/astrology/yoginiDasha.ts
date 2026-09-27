import type { PlanetName } from "./constants";

const NAKSHATRA_SPAN = 360 / 27;

/**
 * Yogini dasha: eight Yoginis ruling 1 to 8 years in turn, a 36-year cycle.
 * The first Yogini comes from the birth nakshatra — (nakshatra number + 3)
 * counted in eights — and the unexpired part of that nakshatra gives the
 * balance at birth. Each Yogini divides into eight sub-periods in the same
 * order, starting from itself, in proportion to their years.
 */

export interface Yogini {
  name: string;
  lord: PlanetName;
  years: number;
  nature: "Auspicious" | "Mixed" | "Inauspicious";
  meaning: string;
}

export const YOGINIS: Yogini[] = [
  { name: "Mangala", lord: "Moon", years: 1, nature: "Auspicious", meaning: "Auspicious beginnings, emotional contentment, family happiness and success in new work." },
  { name: "Pingala", lord: "Sun", years: 2, nature: "Mixed", meaning: "Ambition with stress — authority and recognition, but also heat, conflicts with superiors and health strain." },
  { name: "Dhanya", lord: "Jupiter", years: 3, nature: "Auspicious", meaning: "Prosperity, learning, religious merit, children and wise counsel — one of the best Yoginis." },
  { name: "Bhramari", lord: "Mars", years: 4, nature: "Inauspicious", meaning: "Restlessness and wandering — travel, disputes, property matters, accidents; energy that needs direction." },
  { name: "Bhadrika", lord: "Mercury", years: 5, nature: "Auspicious", meaning: "Good fortune through intelligence — trade, education, friends, communication and comfort." },
  { name: "Ulka", lord: "Saturn", years: 6, nature: "Inauspicious", meaning: "Hard work, delays and losses; health and career pressure that builds endurance." },
  { name: "Siddha", lord: "Venus", years: 7, nature: "Auspicious", meaning: "Accomplishment — comforts, marriage, vehicles, arts and fulfilment of desires." },
  { name: "Sankata", lord: "Rahu", years: 8, nature: "Inauspicious", meaning: "Crisis and upheaval — confusion, sudden setbacks and fear, which force deep change." },
];

const YEAR_MS = 365.25 * 86400000;

export interface YoginiPeriod {
  yogini: Yogini;
  start: Date;
  end: Date;
  subPeriods: { yogini: Yogini; start: Date; end: Date }[];
}

/** The Yogini that starts life: (nakshatra number + 3) mod 8, where 0 means the 8th (Sankata). */
export function firstYogini(nakshatraIndex: number): number {
  const n = (nakshatraIndex + 1 + 3) % 8;
  return (n === 0 ? 8 : n) - 1;
}

export function yoginiDasha(moonLongitude: number, birth: Date, years = 110): YoginiPeriod[] {
  const nakIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
  const elapsedFraction = (moonLongitude - nakIndex * NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
  let idx = firstYogini(nakIndex);
  const first = YOGINIS[idx];
  // The first Yogini began before birth; rebuild it from its theoretical start.
  let cursor = birth.getTime() - elapsedFraction * first.years * YEAR_MS;
  const endOfRange = birth.getTime() + years * YEAR_MS;
  const out: YoginiPeriod[] = [];
  while (cursor < endOfRange) {
    const y = YOGINIS[idx];
    const start = cursor;
    const end = start + y.years * YEAR_MS;
    const subs: YoginiPeriod["subPeriods"] = [];
    let sc = start;
    for (let k = 0; k < 8; k++) {
      const sy = YOGINIS[(idx + k) % 8];
      const se = sc + ((y.years * sy.years) / 36) * YEAR_MS;
      if (se > birth.getTime()) subs.push({ yogini: sy, start: new Date(Math.max(sc, birth.getTime())), end: new Date(se) });
      sc = se;
    }
    if (end > birth.getTime()) out.push({ yogini: y, start: new Date(Math.max(start, birth.getTime())), end: new Date(end), subPeriods: subs });
    cursor = end;
    idx = (idx + 1) % 8;
  }
  return out;
}
