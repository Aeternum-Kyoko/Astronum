import { SIGNS, type AshtakavargaPlanet, type PlanetName, type VargaKey } from "./constants";
import { EXALTATION_SIGN, OWN_SIGNS } from "./dignity";
import { relationToSignLord, type CombinedRelation } from "./panchadhaMaitri";
import { BAV_TABLES, CONTRIBUTORS, type Contributor } from "./ashtakavarga";
import { charaKarakas, lordOfSign } from "./charaDasha";
import type { KundaliChart } from "./types";

/**
 * Reference tables printed in full kundli software: Jaimini Arudha padas,
 * Upapada and Karakamsha; Vimshopaka bala in its four classical schemes;
 * Prastarashtakavarga (who contributed each bindu); and the Ghatak chakra.
 */

const dist = (a: number, b: number) => ((b - a + 12) % 12) + 1;

// ——— Jaimini ——————————————————————————————————————————————————————

export const PADA_NAMES = [
  "Arudha Lagna (AL) — how the world sees you",
  "Dhana Pada (A2) — visible wealth",
  "Vikrama Pada (A3) — courage and siblings",
  "Matri Pada (A4) — home and property",
  "Mantra Pada (A5) — children and learning",
  "Roga Pada (A6) — enemies and illness",
  "Dara Pada (A7) — partners and trade",
  "Mrityu Pada (A8) — hidden matters",
  "Bhagya Pada (A9) — fortune and dharma",
  "Rajya Pada (A10) — career image",
  "Labha Pada (A11) — gains",
  "Upapada (UL) — marriage and the spouse",
];

const KARAKAMSHA_MEANING = [
  "Aries: energetic and independent; interest in sport, the army or engineering.",
  "Taurus: comfort-loving and steady; drawn to wealth, beauty and trade.",
  "Gemini: curious and skilled with words; writing, trade and many interests.",
  "Cancer: caring and emotional; home, public service and water-related work.",
  "Leo: proud and authoritative; leadership, government and recognition.",
  "Virgo: analytical and precise; service, medicine, accounting and craft.",
  "Libra: balanced and diplomatic; law, trade, partnership and the arts.",
  "Scorpio: intense and investigative; research, occult and transformation.",
  "Sagittarius: principled and generous; teaching, law, religion and travel.",
  "Capricorn: ambitious and disciplined; administration and long effort.",
  "Aquarius: humanitarian and unconventional; technology and social causes.",
  "Pisces: spiritual and compassionate; liberation, charity and the arts.",
];

export interface ArudhaPada {
  house: number;
  name: string;
  signIndex: number;
  sign: string;
  houseFromLagna: number;
  planets: PlanetName[];
}

export interface JaiminiTables {
  padas: ArudhaPada[];
  upapada: { sign: string; secondFrom: string; lordOfSecond: PlanetName; planets: PlanetName[]; note: string };
  karakamsha: { atmakaraka: PlanetName; sign: string; meaning: string; planetsInD9: PlanetName[]; houseFromLagna: number };
}

export function jaiminiTables(chart: KundaliChart): JaiminiTables {
  const lagna = chart.ascendant.signIndex;
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const inSign = (s: number) => chart.planets.filter((p) => p.signIndex === s).map((p) => p.planet);
  const padas: ArudhaPada[] = Array.from({ length: 12 }, (_, i) => {
    const s = (lagna + i) % 12;
    const lord = lordOfSign(chart, s);
    const ls = P.get(lord)!.signIndex;
    const n = dist(s, ls);
    let a = (ls + n - 1) % 12;
    // An Arudha can't fall in its own house or the 7th from it; then the 10th from there is taken.
    if (a === s || a === (s + 6) % 12) a = (a + 9) % 12;
    return { house: i + 1, name: PADA_NAMES[i], signIndex: a, sign: SIGNS[a], houseFromLagna: dist(lagna, a), planets: inSign(a) };
  });
  const ul = padas[11];
  const second = (ul.signIndex + 1) % 12;
  const secondLord = lordOfSign(chart, second);
  const secondPlanets = inSign(second);
  const malefic = secondPlanets.filter((p) => ["Saturn", "Rahu", "Ketu", "Mars", "Sun"].includes(p));
  const upapada = {
    sign: ul.sign,
    secondFrom: SIGNS[second],
    lordOfSecond: secondLord,
    planets: ul.planets,
    note: `The 2nd from the Upapada (${SIGNS[second]}) shows how the marriage is sustained; ${malefic.length ? `${malefic.join(" and ")} there can strain it` : secondPlanets.length ? `${secondPlanets.join(" and ")} there support it` : `its lord ${secondLord} carries the result`}.`,
  };

  const ak = charaKarakas(chart)[0];
  const d9 = chart.divisionalCharts.D9;
  const akD9 = d9.planets.find((p) => p.planet === ak.planet)!;
  const karakamsha = {
    atmakaraka: ak.planet,
    sign: SIGNS[akD9.signIndex],
    meaning: KARAKAMSHA_MEANING[akD9.signIndex],
    planetsInD9: d9.planets.filter((p) => p.signIndex === akD9.signIndex && p.planet !== ak.planet).map((p) => p.planet),
    houseFromLagna: dist(lagna, akD9.signIndex),
  };
  return { padas, upapada, karakamsha };
}

// ——— Vimshopaka bala ——————————————————————————————————————————————

const SCHEMES: { name: string; weights: Partial<Record<VargaKey, number>> }[] = [
  { name: "Shadvarga", weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
  { name: "Saptavarga", weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
  { name: "Dashavarga", weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
  { name: "Shodashavarga", weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } },
];
const REL_POINTS: Record<CombinedRelation, number> = { GreatFriend: 18, Friend: 15, Neutral: 10, Enemy: 7, GreatEnemy: 5 };
const SEVEN: AshtakavargaPlanet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export interface VimshopakaRow {
  planet: AshtakavargaPlanet;
  scores: Record<string, number>;
  verdict: string;
}

/** Each planet's strength across the divisional charts, out of 20, in the four classical schemes. */
export function vimshopakaBala(chart: KundaliChart): VimshopakaRow[] {
  return SEVEN.map((planet) => {
    const scores: Record<string, number> = {};
    for (const sc of SCHEMES) {
      let total = 0;
      for (const [key, w] of Object.entries(sc.weights) as [VargaKey, number][]) {
        const V = chart.divisionalCharts[key];
        if (!V) continue;
        const signs = Object.fromEntries(SEVEN.map((pl) => [pl, V.planets.find((x) => x.planet === pl)!.signIndex])) as Record<AshtakavargaPlanet, number>;
        const s = signs[planet];
        const rel = relationToSignLord(planet, s, signs);
        const pts = EXALTATION_SIGN[planet] === s || OWN_SIGNS[planet]?.includes(s) || rel === null ? 20 : REL_POINTS[rel];
        total += (w * pts) / 20;
      }
      scores[sc.name] = Math.round(total * 100) / 100;
    }
    const s = scores.Shodashavarga;
    return { planet, scores, verdict: s >= 15 ? "Very strong" : s >= 12 ? "Strong" : s >= 9 ? "Moderate" : "Weak" };
  });
}

export const VIMSHOPAKA_SCHEMES = SCHEMES.map((s) => s.name);

// ——— Prastarashtakavarga ——————————————————————————————————————————

/** For one planet's Ashtakavarga: which of the 8 contributors gave a bindu in each sign. */
export function prastarashtakavarga(chart: KundaliChart, target: AshtakavargaPlanet): { contributor: Contributor; bindus: boolean[] }[] {
  const signOf = (c: Contributor) => (c === "Ascendant" ? chart.ascendant.signIndex : chart.planets.find((p) => p.planet === c)!.signIndex);
  return CONTRIBUTORS.map((c) => {
    const from = signOf(c);
    const houses = BAV_TABLES[target][c];
    return { contributor: c, bindus: Array.from({ length: 12 }, (_, s) => houses.includes(dist(from, s))) };
  });
}

// ——— Ghatak chakra —————————————————————————————————————————————————

export interface Ghatak {
  moonSign: string;
  month: string;
  tithi: string;
  weekday: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  prahar: number;
  lagna: string;
  ghatakRasi: string;
}

// By janma rasi (Moon sign), Aries first.
const GHATAK: Omit<Ghatak, "moonSign">[] = [
  { ghatakRasi: "Aries", month: "Kartika", tithi: "Nanda (1, 6, 11)", weekday: "Sunday", nakshatra: "Magha", yoga: "Vishkumbha", karana: "Bava", prahar: 1, lagna: "Aries" },
  { ghatakRasi: "Virgo", month: "Margashirsha", tithi: "Purna (5, 10, 15)", weekday: "Saturday", nakshatra: "Hasta", yoga: "Shula", karana: "Shakuni", prahar: 4, lagna: "Taurus" },
  { ghatakRasi: "Aquarius", month: "Ashadha", tithi: "Bhadra (2, 7, 12)", weekday: "Monday", nakshatra: "Swati", yoga: "Parigha", karana: "Kaulava", prahar: 3, lagna: "Cancer" },
  { ghatakRasi: "Leo", month: "Pausha", tithi: "Bhadra (2, 7, 12)", weekday: "Wednesday", nakshatra: "Anuradha", yoga: "Vyaghata", karana: "Naga", prahar: 1, lagna: "Libra" },
  { ghatakRasi: "Capricorn", month: "Jyeshtha", tithi: "Jaya (3, 8, 13)", weekday: "Saturday", nakshatra: "Mula", yoga: "Dhriti", karana: "Bava", prahar: 1, lagna: "Capricorn" },
  { ghatakRasi: "Gemini", month: "Bhadrapada", tithi: "Purna (5, 10, 15)", weekday: "Saturday", nakshatra: "Shravana", yoga: "Shula", karana: "Kaulava", prahar: 1, lagna: "Pisces" },
  { ghatakRasi: "Sagittarius", month: "Magha", tithi: "Rikta (4, 9, 14)", weekday: "Thursday", nakshatra: "Shatabhisha", yoga: "Shukla", karana: "Taitila", prahar: 4, lagna: "Virgo" },
  { ghatakRasi: "Taurus", month: "Ashwin", tithi: "Nanda (1, 6, 11)", weekday: "Friday", nakshatra: "Revati", yoga: "Vyatipata", karana: "Garaja", prahar: 1, lagna: "Taurus" },
  { ghatakRasi: "Pisces", month: "Shravana", tithi: "Jaya (3, 8, 13)", weekday: "Friday", nakshatra: "Bharani", yoga: "Vajra", karana: "Taitila", prahar: 1, lagna: "Gemini" },
  { ghatakRasi: "Leo", month: "Vaishakha", tithi: "Rikta (4, 9, 14)", weekday: "Tuesday", nakshatra: "Rohini", yoga: "Vaidhriti", karana: "Shakuni", prahar: 4, lagna: "Leo" },
  { ghatakRasi: "Sagittarius", month: "Chaitra", tithi: "Jaya (3, 8, 13)", weekday: "Thursday", nakshatra: "Ardra", yoga: "Ganda", karana: "Kinstughna", prahar: 3, lagna: "Sagittarius" },
  { ghatakRasi: "Aquarius", month: "Phalguna", tithi: "Purna (5, 10, 15)", weekday: "Friday", nakshatra: "Ashlesha", yoga: "Vajra", karana: "Chatushpada", prahar: 4, lagna: "Aquarius" },
];

export function ghatakChakra(chart: KundaliChart): Ghatak {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  return { moonSign: SIGNS[moon.signIndex], ...GHATAK[moon.signIndex] };
}

