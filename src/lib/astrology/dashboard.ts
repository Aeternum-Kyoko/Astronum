import { DateTime } from "luxon";
import { NAKSHATRAS, SIGN_LORDS, SIGNS, type PlanetName, type SignName } from "./constants";
import { charaKarakas, type KarakaName } from "./charaDasha";
import { getDignity, type Dignity } from "./dignity";
import { isCombust } from "./birthDetails";
import { kpLords } from "./kp";
import { vimshopakaBala } from "./kundliTables";
import { normalizeDegrees } from "./math";
import { computeDailyPanchang } from "./panchang";
import type { KundaliChart } from "./types";

/**
 * The at-a-glance numbers an astrologer checks first, in one place: every
 * graha's D1 and D9 position to the second, its star and sub lords, rashi vs
 * chalit house, dignity in both charts, avastha, Chara karaka, lordships and
 * strength — plus the birth-time facts (sunrise, Vedic weekday, Ishta Kaal).
 */

export type Avastha = "Bala" | "Kumara" | "Yuva" | "Vriddha" | "Mrita";

const AVASTHAS: Avastha[] = ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"];

/** Baladi avastha: five 6° bands, counted forward in odd signs and backward in even signs. */
export function baladiAvastha(signIndex: number, degreeInSign: number): Avastha {
  const band = Math.min(4, Math.floor(degreeInSign / 6));
  return AVASTHAS[signIndex % 2 === 0 ? band : 4 - band];
}

/** Navamsa position with its degree: the longitude stretched ninefold. */
export function navamsaPosition(siderealLongitude: number): { signIndex: number; degree: number } {
  const lon = normalizeDegrees(siderealLongitude) * 9;
  const signIndex = Math.floor(lon / 30) % 12;
  return { signIndex, degree: lon % 30 };
}

export interface GrahaRow {
  planet: PlanetName | "Lagna";
  longitude: number;
  sign: SignName;
  degree: number;
  nakshatra: string;
  pada: number;
  starLord: PlanetName;
  subLord: PlanetName;
  house: number;
  chalitHouse: number;
  dignity: Dignity | null;
  d9Sign: SignName;
  d9Degree: number;
  d9Dignity: Dignity | null;
  vargottama: boolean;
  retrograde: boolean;
  combust: boolean;
  avastha: Avastha | null;
  karaka: KarakaName | null;
  rules: number[];
  shadbala: { rupas: number; required: number; ratio: number } | null;
  /** Shodashavarga Vimshopaka, out of 20. */
  vimshopaka: number | null;
}

const NAK_SPAN = 360 / 27;

export function grahaTable(chart: KundaliChart): GrahaRow[] {
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const chalit = new Map(chart.chalitHouses.map((c) => [c.planet, c.house]));
  const karakas = new Map(charaKarakas(chart).map((k) => [k.planet, k.karaka]));
  const shadbala = new Map(chart.shadbala.map((s) => [s.planet, s]));
  const vimshopaka = new Map(vimshopakaBala(chart).map((v) => [v.planet, v.scores.Shodashavarga]));
  const asc = chart.ascendant.signIndex;

  const ascLon = chart.ascendant.siderealLongitude;
  const ascNak = Math.floor(ascLon / NAK_SPAN);
  const ascKp = kpLords(ascLon);
  const ascD9 = navamsaPosition(ascLon);
  const lagna: GrahaRow = {
    planet: "Lagna",
    longitude: ascLon,
    sign: chart.ascendant.sign,
    degree: chart.ascendant.degreeInSign,
    nakshatra: NAKSHATRAS[ascNak],
    pada: Math.floor((ascLon % NAK_SPAN) / (NAK_SPAN / 4)) + 1,
    starLord: ascKp.starLord,
    subLord: ascKp.subLord,
    house: 1,
    chalitHouse: 1,
    dignity: null,
    d9Sign: SIGNS[ascD9.signIndex] as SignName,
    d9Degree: ascD9.degree,
    d9Dignity: null,
    vargottama: ascD9.signIndex === asc,
    retrograde: false,
    combust: false,
    avastha: null,
    karaka: null,
    rules: [],
    shadbala: null,
    vimshopaka: null,
  };

  return [
    lagna,
    ...chart.planets.map((p) => {
      const kp = kpLords(p.siderealLongitude);
      const d9 = navamsaPosition(p.siderealLongitude);
      const sb = shadbala.get(p.planet as never);
      return {
        planet: p.planet,
        longitude: p.siderealLongitude,
        sign: p.sign,
        degree: p.degreeInSign,
        nakshatra: p.nakshatra,
        pada: p.pada,
        starLord: kp.starLord,
        subLord: kp.subLord,
        house: p.house,
        chalitHouse: chalit.get(p.planet) ?? p.house,
        dignity: p.dignity,
        d9Sign: SIGNS[d9.signIndex] as SignName,
        d9Degree: d9.degree,
        d9Dignity: getDignity(p.planet, d9.signIndex),
        vargottama: d9.signIndex === p.signIndex,
        retrograde: p.retrograde,
        combust: p.planet !== "Sun" && isCombust(p, sun),
        avastha: p.planet === "Rahu" || p.planet === "Ketu" ? null : baladiAvastha(p.signIndex, p.degreeInSign),
        karaka: karakas.get(p.planet) ?? null,
        rules: Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => SIGN_LORDS[(asc + h - 1) % 12] === p.planet),
        shadbala: sb ? { rupas: sb.rupas, required: sb.requiredRupas, ratio: sb.rupas / sb.requiredRupas } : null,
        vimshopaka: vimshopaka.get(p.planet as never) ?? null,
      };
    }),
  ];
}

const VARA = [
  { name: "Sunday", sanskrit: "Ravivara", lord: "Sun" },
  { name: "Monday", sanskrit: "Somavara", lord: "Moon" },
  { name: "Tuesday", sanskrit: "Mangalavara", lord: "Mars" },
  { name: "Wednesday", sanskrit: "Budhavara", lord: "Mercury" },
  { name: "Thursday", sanskrit: "Guruvara", lord: "Jupiter" },
  { name: "Friday", sanskrit: "Shukravara", lord: "Venus" },
  { name: "Saturday", sanskrit: "Shanivara", lord: "Saturn" },
] as const;

export interface BirthTime {
  sunrise: Date;
  sunset: Date;
  /** The Vedic weekday, which turns at sunrise rather than midnight. */
  vara: (typeof VARA)[number];
  /** Born between sunset and the next sunrise. */
  night: boolean;
  /** Time from the sunrise that began this Vedic day to birth, in ghatis (24 minutes each) and palas. */
  ishtaKaal: { ghati: number; pala: number };
}

/** Sunrise, Vedic weekday and Ishta Kaal for the birth moment; null where the Sun doesn't rise or set. */
export function birthTime(chart: KundaliChart): BirthTime | null {
  const { latitude, longitude, timezone } = chart.input;
  const birth = new Date(chart.utcDate);
  const local = DateTime.fromJSDate(birth, { zone: timezone });
  try {
    let day = computeDailyPanchang(local.toISODate()!, latitude, longitude, timezone);
    let dayStart = local;
    if (birth < day.sunrise) {
      // Before sunrise the Vedic day is still the previous one.
      dayStart = local.minus({ days: 1 });
      day = computeDailyPanchang(dayStart.toISODate()!, latitude, longitude, timezone);
    }
    const minutes = (birth.getTime() - day.sunrise.getTime()) / 60000;
    const totalPala = Math.round(minutes * 2.5); // 1 ghati = 24 min = 60 palas
    return {
      sunrise: day.sunrise,
      sunset: day.sunset,
      vara: VARA[dayStart.weekday % 7],
      night: birth >= day.sunset,
      ishtaKaal: { ghati: Math.floor(totalPala / 60), pala: totalPala % 60 },
    };
  } catch {
    return null;
  }
}
