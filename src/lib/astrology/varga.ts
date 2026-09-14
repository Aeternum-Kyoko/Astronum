import { SIGNS, VARGA_KEYS, type SignName, type VargaKey } from "./constants";
import { normalizeDegrees, signOffsetHouse } from "./math";
import { navamsaSignIndex } from "./navamsa";
import type { DivisionalChart, PlanetPlacement } from "./types";

export { VARGA_KEYS };
export type { VargaKey };

const MOVABLE = new Set([0, 3, 6, 9]); // Aries, Cancer, Libra, Capricorn
const FIXED = new Set([1, 4, 7, 10]); // Taurus, Leo, Scorpio, Aquarius
const FIRE = new Set([0, 4, 8]);
const EARTH = new Set([1, 5, 9]);
const AIR = new Set([2, 6, 10]);

const isOddSign = (signIndex: number) => signIndex % 2 === 0; // Aries (index 0) is the 1st sign, i.e. odd

function movableFixedDualStart(signIndex: number, movableStart: number, fixedStart: number, dualStart: number): number {
  if (MOVABLE.has(signIndex)) return movableStart;
  if (FIXED.has(signIndex)) return fixedStart;
  return dualStart;
}

/** D2 — Hora: odd sign's first half is Leo (Sun's Hora), second half Cancer (Moon's); even sign reversed. */
function hora(signIndex: number, deg: number): number {
  const firstHalf = deg < 15;
  const odd = isOddSign(signIndex);
  if (odd) return firstHalf ? 4 : 3;
  return firstHalf ? 3 : 4;
}

/** D3 — Drekkana: each 10° third counts 0/4/8 signs onward from itself. */
function drekkana(signIndex: number, deg: number): number {
  const pada = Math.min(2, Math.floor(deg / 10));
  return (signIndex + pada * 4) % 12;
}

/** D4 — Chaturthamsa: each 7.5° quarter counts 0/3/6/9 signs onward from itself. */
function chaturthamsa(signIndex: number, deg: number): number {
  const pada = Math.min(3, Math.floor(deg / 7.5));
  return (signIndex + pada * 3) % 12;
}

/** D7 — Saptamsa: odd sign starts counting from itself, even sign from its own 7th. */
function saptamsa(signIndex: number, deg: number): number {
  const pada = Math.min(6, Math.floor(deg / (30 / 7)));
  const start = isOddSign(signIndex) ? signIndex : (signIndex + 6) % 12;
  return (start + pada) % 12;
}

/** D10 — Dasamsa: odd sign starts counting from itself, even sign from its own 9th. */
function dasamsa(signIndex: number, deg: number): number {
  const pada = Math.min(9, Math.floor(deg / 3));
  const start = isOddSign(signIndex) ? signIndex : (signIndex + 8) % 12;
  return (start + pada) % 12;
}

/** D12 — Dwadasamsa: each 2.5° part counts onward from itself. */
function dwadasamsa(signIndex: number, deg: number): number {
  const pada = Math.min(11, Math.floor(deg / 2.5));
  return (signIndex + pada) % 12;
}

/** D16 — Shodasamsa: movable signs start from Aries, fixed from Leo, dual from Sagittarius. */
function shodasamsa(signIndex: number, deg: number): number {
  const pada = Math.min(15, Math.floor(deg / 1.875));
  const start = movableFixedDualStart(signIndex, 0, 4, 8);
  return (start + pada) % 12;
}

/** D20 — Vimsamsa: movable signs start from Aries, fixed from Sagittarius, dual from Leo. */
function vimsamsa(signIndex: number, deg: number): number {
  const pada = Math.min(19, Math.floor(deg / 1.5));
  const start = movableFixedDualStart(signIndex, 0, 8, 4);
  return (start + pada) % 12;
}

/** D24 — Chaturvimsamsa (Siddhamsa): odd sign starts from Leo, even sign from Cancer. */
function chaturvimsamsa(signIndex: number, deg: number): number {
  const pada = Math.min(23, Math.floor(deg / 1.25));
  const start = isOddSign(signIndex) ? 4 : 3;
  return (start + pada) % 12;
}

/** D27 — Bhamsa (Nakshatramsa): fire signs start from Aries, earth from Cancer, air from Libra, water from Capricorn. */
function bhamsa(signIndex: number, deg: number): number {
  const pada = Math.min(26, Math.floor(deg / (30 / 27)));
  const start = FIRE.has(signIndex) ? 0 : EARTH.has(signIndex) ? 3 : AIR.has(signIndex) ? 6 : 9;
  return (start + pada) % 12;
}

// D30 — Trimsamsa: NOT equal divisions. Each 30° is split into five unequal
// planetary-ruled spans, mirrored between odd and even signs.
const ODD_TRIMSAMSA: [number, number, number][] = [
  [0, 5, 0], // Mars -> Aries
  [5, 10, 10], // Saturn -> Aquarius
  [10, 18, 8], // Jupiter -> Sagittarius
  [18, 25, 2], // Mercury -> Gemini
  [25, 30, 6], // Venus -> Libra
];
const EVEN_TRIMSAMSA: [number, number, number][] = [
  [0, 5, 1], // Venus -> Taurus
  [5, 12, 5], // Mercury -> Virgo
  [12, 20, 11], // Jupiter -> Pisces
  [20, 25, 9], // Saturn -> Capricorn
  [25, 30, 7], // Mars -> Scorpio
];

function trimsamsa(signIndex: number, deg: number): number {
  const table = isOddSign(signIndex) ? ODD_TRIMSAMSA : EVEN_TRIMSAMSA;
  const row = table.find(([from, to]) => deg >= from && deg < to) ?? table[table.length - 1];
  return row[2];
}

/** D40 — Khavedamsa: odd sign starts from Aries, even sign from Libra. */
function khavedamsa(signIndex: number, deg: number): number {
  const pada = Math.min(39, Math.floor(deg / 0.75));
  const start = isOddSign(signIndex) ? 0 : 6;
  return (start + pada) % 12;
}

/** D45 — Akshavedamsa: movable signs start from Aries, fixed from Leo, dual from Sagittarius. */
function akshavedamsa(signIndex: number, deg: number): number {
  const pada = Math.min(44, Math.floor(deg / (2 / 3)));
  const start = movableFixedDualStart(signIndex, 0, 4, 8);
  return (start + pada) % 12;
}

/** D60 — Shashtiamsa: each 0.5° part counts onward from itself. */
function shashtiamsa(signIndex: number, deg: number): number {
  const pada = Math.min(59, Math.floor(deg / 0.5));
  return (signIndex + pada) % 12;
}

/** Sign index (0-11) a sidereal longitude falls into for a given divisional chart, per BPHS. */
export function computeVarga(division: VargaKey, siderealLongitude: number): number {
  const lon = normalizeDegrees(siderealLongitude);
  if (division === "D9") return navamsaSignIndex(lon);

  const signIndex = Math.floor(lon / 30);
  const deg = lon - signIndex * 30;

  switch (division) {
    case "D1":
      return signIndex;
    case "D2":
      return hora(signIndex, deg);
    case "D3":
      return drekkana(signIndex, deg);
    case "D4":
      return chaturthamsa(signIndex, deg);
    case "D7":
      return saptamsa(signIndex, deg);
    case "D10":
      return dasamsa(signIndex, deg);
    case "D12":
      return dwadasamsa(signIndex, deg);
    case "D16":
      return shodasamsa(signIndex, deg);
    case "D20":
      return vimsamsa(signIndex, deg);
    case "D24":
      return chaturvimsamsa(signIndex, deg);
    case "D27":
      return bhamsa(signIndex, deg);
    case "D30":
      return trimsamsa(signIndex, deg);
    case "D40":
      return khavedamsa(signIndex, deg);
    case "D45":
      return akshavedamsa(signIndex, deg);
    case "D60":
      return shashtiamsa(signIndex, deg);
  }
}

export function computeDivisionalChart(
  division: VargaKey,
  ascendantSiderealLongitude: number,
  planets: PlanetPlacement[]
): DivisionalChart {
  const ascSignIndex = computeVarga(division, ascendantSiderealLongitude);

  return {
    ascendant: { sign: SIGNS[ascSignIndex] as SignName, signIndex: ascSignIndex },
    planets: planets.map((p) => {
      const signIndex = computeVarga(division, p.siderealLongitude);
      return {
        planet: p.planet,
        sign: SIGNS[signIndex] as SignName,
        signIndex,
        house: signOffsetHouse(signIndex, ascSignIndex),
        retrograde: p.retrograde,
      };
    }),
  };
}

export function computeAllDivisionalCharts(
  ascendantSiderealLongitude: number,
  planets: PlanetPlacement[]
): Record<VargaKey, DivisionalChart> {
  const result = {} as Record<VargaKey, DivisionalChart>;
  for (const key of VARGA_KEYS) {
    result[key] = computeDivisionalChart(key, ascendantSiderealLongitude, planets);
  }
  return result;
}
