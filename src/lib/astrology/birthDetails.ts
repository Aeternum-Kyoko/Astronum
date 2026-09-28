import { NAKSHATRAS, SIGN_LORDS, type PlanetName } from "./constants";
import { nakshatraLord } from "./dasha";
import { normalizeDegrees } from "./math";
import type { PlanetPlacement } from "./types";

/**
 * Birth-time Panchang and Avakahada Chakra — the "basic details" block every
 * Indian kundali report opens with. Everything here is a pure lookup off the
 * Sun/Moon sidereal longitudes and the Moon's sign/nakshatra, so it needs no
 * extra ephemeris work beyond what calculateKundali already does.
 */

const TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
] as const;

const NITYA_YOGAS = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
] as const;

const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"] as const;

export interface BirthPanchang {
  tithi: string;
  tithiNumber: number; // 1–30 across the lunar month
  paksha: "Shukla" | "Krishna";
  yoga: string;
  karana: string;
}

/** Tithi name for a 0–29 index across the lunar month (0 = Shukla Pratipada, 29 = Amavasya). */
export function tithiName(index: number): { tithi: string; paksha: "Shukla" | "Krishna" } {
  const paksha = index < 15 ? "Shukla" : "Krishna";
  const inPaksha = index % 15;
  const tithi = inPaksha === 14 ? (paksha === "Shukla" ? "Purnima" : "Amavasya") : TITHI_NAMES[inPaksha];
  return { tithi, paksha };
}

/** Nitya yoga for a 0–26 index. */
export function yogaName(index: number): string {
  return NITYA_YOGAS[index];
}

/**
 * Karana for a 0–59 half-tithi index: one fixed karana opens the lunar month,
 * the 7 movable karanas cycle through the next 56, and three fixed karanas close it.
 */
export function karanaName(index: number): string {
  if (index === 0) return "Kimstughna";
  if (index <= 56) return MOVABLE_KARANAS[(index - 1) % 7];
  return (["Shakuni", "Chatushpada", "Naga"] as const)[index - 57];
}

export const tithiIndex = (sun: number, moon: number) => Math.floor(normalizeDegrees(moon - sun) / 12);
export const yogaIndex = (sun: number, moon: number) => Math.floor(normalizeDegrees(sun + moon) / (360 / 27));
export const karanaIndex = (sun: number, moon: number) => Math.floor(normalizeDegrees(moon - sun) / 6);

export function computeBirthPanchang(sunLongitude: number, moonLongitude: number): BirthPanchang {
  const t = tithiIndex(sunLongitude, moonLongitude);
  return {
    ...tithiName(t),
    tithiNumber: t + 1,
    yoga: yogaName(yogaIndex(sunLongitude, moonLongitude)),
    karana: karanaName(karanaIndex(sunLongitude, moonLongitude)),
  };
}

const VARNA_BY_SIGN = [
  "Kshatriya",
  "Vaishya",
  "Shudra",
  "Brahmin",
  "Kshatriya",
  "Vaishya",
  "Shudra",
  "Brahmin",
  "Kshatriya",
  "Vaishya",
  "Shudra",
  "Brahmin",
] as const;

const GANA_BY_NAKSHATRA = [
  "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva", "Rakshasa",
  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva",
] as const;

const YONI_BY_NAKSHATRA = [
  "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog", "Cat", "Sheep", "Cat",
  "Rat", "Rat", "Cow", "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
  "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse", "Lion", "Cow", "Elephant",
] as const;

// Nadi runs in a back-and-forth "snake" of Adi → Madhya → Antya → Antya → Madhya → Adi.
const NADI_CYCLE = ["Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi"] as const;

function vashya(signIndex: number, degreeInSign: number): string {
  const firstHalf = degreeInSign < 15;
  switch (signIndex) {
    case 0:
    case 1:
      return "Chatushpada";
    case 3:
    case 11:
      return "Jalachara";
    case 4:
      return "Vanachara";
    case 7:
      return "Keeta";
    case 8:
      return firstHalf ? "Manava" : "Chatushpada";
    case 9:
      return firstHalf ? "Chatushpada" : "Jalachara";
    default:
      return "Manava"; // Gemini, Virgo, Libra, Aquarius
  }
}

export interface Avakahada {
  varna: string;
  vashya: string;
  yoni: string;
  gana: string;
  nadi: string;
  signLord: PlanetName;
  nakshatraLord: PlanetName;
}

export function computeAvakahada(moon: Pick<PlanetPlacement, "signIndex" | "degreeInSign" | "nakshatraIndex">): Avakahada {
  const n = moon.nakshatraIndex;
  if (n < 0 || n >= NAKSHATRAS.length) throw new Error(`Invalid nakshatra index ${n}`);
  return {
    varna: VARNA_BY_SIGN[moon.signIndex],
    vashya: vashya(moon.signIndex, moon.degreeInSign),
    yoni: YONI_BY_NAKSHATRA[n],
    gana: GANA_BY_NAKSHATRA[n],
    nadi: NADI_CYCLE[n % 6],
    signLord: SIGN_LORDS[moon.signIndex],
    nakshatraLord: nakshatraLord(n),
  };
}

// Classical combustion orbs (degrees from the Sun); Mercury and Venus use a
// tighter orb when retrograde.
export const COMBUSTION_ORB: Partial<Record<PlanetName, [direct: number, retro: number]>> = {
  Moon: [12, 12],
  Mars: [17, 17],
  Mercury: [14, 12],
  Jupiter: [11, 11],
  Venus: [10, 8],
  Saturn: [15, 15],
};

export function isCombust(planet: PlanetPlacement, sun: PlanetPlacement): boolean {
  const orb = COMBUSTION_ORB[planet.planet];
  if (!orb) return false;
  const diff = normalizeDegrees(planet.siderealLongitude - sun.siderealLongitude);
  const separation = Math.min(diff, 360 - diff);
  return separation <= (planet.retrograde ? orb[1] : orb[0]);
}
