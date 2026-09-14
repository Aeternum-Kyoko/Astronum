import { aspectsSign, BENEFIC_PLANETS } from "./aspects";
import { ASHTAKAVARGA_PLANETS, type AshtakavargaPlanet, type VargaKey } from "./constants";
import { dailyMotion, isDaytimeBirth } from "./ephemeris";
import { normalizeDegrees } from "./math";
import { vargaDignityPoints } from "./panchadhaMaitri";
import type { DivisionalChart, PlanetPlacement, ShadbalaResult } from "./types";

/**
 * Shadbala — the classical six-fold planetary strength — computed as a
 * *documented approximation*, not full BPHS precision:
 *   - Sthana Bala: full (Uchcha + Saptavargaja + Ojayugmarasyamsa + Kendradi + Drekkana).
 *   - Dig Bala: full, using the actual Ascendant degree and real longitudes.
 *   - Kaala Bala: PARTIAL — only Nathonnata + Paksha Bala. Tribhaga, the
 *     Varsha/Masa/Dina/Hora-lord balas, and Ayana Bala are not implemented.
 *   - Chesta Bala: approximated from retrograde state and speed relative to
 *     mean daily motion for the five non-luminaries; the Sun's classical
 *     Ayana-Bala substitute is omitted (left at 0), the Moon's uses its own
 *     Paksha Bala per the classical substitution rule.
 *   - Naisargika Bala: full (fixed classical constants).
 *   - Drik Bala: a graded same-degree-in-sign approximation of the classical
 *     aspect-strength formula, using real longitudes for the five special
 *     drishtis (all planets' 7th; Mars's 4th/8th; Jupiter's 5th/9th; Saturn's
 *     3rd/10th).
 * Totals are reported in virupas and rupas (virupas/60). Rahu/Ketu have no
 * classical Shadbala and are excluded.
 */

const SAPTAVARGA_KEYS: VargaKey[] = ["D1", "D2", "D3", "D7", "D9", "D12", "D30"];

function saptavargajaBala(
  planet: AshtakavargaPlanet,
  divisionalCharts: Record<VargaKey, DivisionalChart>
): number {
  let total = 0;
  for (const key of SAPTAVARGA_KEYS) {
    const chart = divisionalCharts[key];
    const signIndices = Object.fromEntries(
      chart.planets.filter((p) => (ASHTAKAVARGA_PLANETS as readonly string[]).includes(p.planet)).map((p) => [p.planet, p.signIndex])
    ) as Record<AshtakavargaPlanet, number>;
    const placement = chart.planets.find((p) => p.planet === planet)!;
    total += vargaDignityPoints(planet, placement.signIndex, signIndices);
  }
  return total;
}

const EXACT_EXALTATION_LONGITUDE: Partial<Record<AshtakavargaPlanet, number>> = {
  Sun: 10, // 10° Aries
  Moon: 33, // 3° Taurus
  Mars: 298, // 28° Capricorn
  Mercury: 165, // 15° Virgo
  Jupiter: 95, // 5° Cancer
  Venus: 357, // 27° Pisces
  Saturn: 200, // 20° Libra
};

function uchchaBala(planet: AshtakavargaPlanet, siderealLongitude: number): number {
  const exalt = EXACT_EXALTATION_LONGITUDE[planet];
  if (exalt === undefined) return 0;
  const debilitation = normalizeDegrees(exalt + 180);
  let diff = Math.abs(normalizeDegrees(siderealLongitude - debilitation));
  if (diff > 180) diff = 360 - diff;
  return (diff / 180) * 60;
}

function kendradiBala(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 60;
  if ([2, 5, 8, 11].includes(house)) return 30;
  return 15;
}

const MALE_PLANETS = new Set<AshtakavargaPlanet>(["Sun", "Mars", "Jupiter"]);
const FEMALE_PLANETS = new Set<AshtakavargaPlanet>(["Moon", "Venus"]);
const NEUTER_PLANETS = new Set<AshtakavargaPlanet>(["Mercury", "Saturn"]);

function drekkanaBala(planet: AshtakavargaPlanet, degreeInSign: number): number {
  const third = degreeInSign < 10 ? 0 : degreeInSign < 20 ? 1 : 2;
  if (MALE_PLANETS.has(planet) && third === 0) return 15;
  if (FEMALE_PLANETS.has(planet) && third === 1) return 15;
  if (NEUTER_PLANETS.has(planet) && third === 2) return 15;
  return 0;
}

const PREFERS_ODD = new Set<AshtakavargaPlanet>(["Sun", "Mars", "Jupiter", "Saturn"]);

function ojaYugmaBala(planet: AshtakavargaPlanet, rasiSignIndex: number, navamsaSignIndex: number): number {
  if (planet === "Mercury") return 30; // classical exception: always full
  const oddD1 = rasiSignIndex % 2 === 0;
  const oddD9 = navamsaSignIndex % 2 === 0;
  const wantsOdd = PREFERS_ODD.has(planet);
  let bala = 0;
  if (wantsOdd === oddD1) bala += 15;
  if (wantsOdd === oddD9) bala += 15;
  return bala;
}

const DIG_BALA_STRONG_OFFSET: Partial<Record<AshtakavargaPlanet, number>> = {
  Jupiter: 0,
  Mercury: 0, // strongest at the Lagna
  Sun: 270,
  Mars: 270, // strongest at the 10th
  Saturn: 180, // strongest at the 7th
  Moon: 90,
  Venus: 90, // strongest at the 4th
};

function digBala(planet: AshtakavargaPlanet, siderealLongitude: number, ascendantSiderealLongitude: number): number {
  const offset = DIG_BALA_STRONG_OFFSET[planet] ?? 0;
  const strongLongitude = normalizeDegrees(ascendantSiderealLongitude + offset);
  const weakLongitude = normalizeDegrees(strongLongitude + 180);
  let diff = Math.abs(normalizeDegrees(siderealLongitude - weakLongitude));
  if (diff > 180) diff = 360 - diff;
  return diff / 3;
}

const DAY_STRONG = new Set<AshtakavargaPlanet>(["Sun", "Jupiter", "Venus"]);
const NIGHT_STRONG = new Set<AshtakavargaPlanet>(["Moon", "Mars", "Saturn"]);

function nathonnataBala(planet: AshtakavargaPlanet, isDay: boolean): number {
  if (planet === "Mercury") return 60;
  if (DAY_STRONG.has(planet)) return isDay ? 60 : 0;
  if (NIGHT_STRONG.has(planet)) return isDay ? 0 : 60;
  return 0;
}

const PAKSHA_BENEFICS = new Set<AshtakavargaPlanet>(["Jupiter", "Venus", "Mercury"]);
const PAKSHA_MALEFICS = new Set<AshtakavargaPlanet>(["Sun", "Mars", "Saturn"]);

function pakshaBala(planet: AshtakavargaPlanet, sunLongitude: number, moonLongitude: number): number {
  let elongation = normalizeDegrees(moonLongitude - sunLongitude);
  if (elongation > 180) elongation = 360 - elongation; // 0 at new moon, 180 at full moon
  const beneficBala = elongation / 3;
  if (planet === "Moon" || PAKSHA_BENEFICS.has(planet)) return beneficBala;
  if (PAKSHA_MALEFICS.has(planet)) return 60 - beneficBala;
  return 30;
}

const MEAN_DAILY_MOTION: Partial<Record<AshtakavargaPlanet, number>> = {
  Mars: 0.524,
  Mercury: 4.0923,
  Jupiter: 0.0831,
  Venus: 1.6021,
  Saturn: 0.0334,
};

function chestaBala(planet: AshtakavargaPlanet, date: Date): number {
  const mean = MEAN_DAILY_MOTION[planet];
  if (mean === undefined) return 0;
  const speed = dailyMotion(planet as "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn", date);
  if (speed < 0) return 60; // retrograde
  const ratio = Math.min(1, Math.abs(speed) / mean);
  return Math.max(0, 60 * (1 - ratio));
}

const NAISARGIKA_BALA: Record<AshtakavargaPlanet, number> = {
  Sun: 60,
  Moon: 51.43,
  Venus: 42.86,
  Jupiter: 34.29,
  Mercury: 25.71,
  Mars: 17.14,
  Saturn: 8.57,
};

function drikBala(target: PlanetPlacement, all: PlanetPlacement[]): number {
  let total = 0;
  for (const other of all) {
    if (other.planet === target.planet || other.planet === "Rahu" || other.planet === "Ketu") continue;
    const houseDistance = ((target.signIndex - other.signIndex + 12) % 12) + 1;
    if (!aspectsSign(other.planet, houseDistance)) continue;
    let degreeDiff = Math.abs(target.degreeInSign - other.degreeInSign);
    if (degreeDiff > 15) degreeDiff = 30 - degreeDiff;
    const strength = 60 * (1 - degreeDiff / 15);
    total += BENEFIC_PLANETS.has(other.planet) ? strength : -strength;
  }
  return total;
}

const REQUIRED_RUPAS: Record<AshtakavargaPlanet, number> = {
  Sun: 6,
  Moon: 6,
  Mars: 5,
  Mercury: 7,
  Jupiter: 6.5,
  Venus: 5.5,
  Saturn: 5,
};

export function computeShadbala(
  planets: PlanetPlacement[],
  ascendantSiderealLongitude: number,
  divisionalCharts: Record<VargaKey, DivisionalChart>,
  birthDate: Date,
  latitude: number,
  longitude: number
): ShadbalaResult[] {
  const byPlanet = new Map(planets.map((p) => [p.planet, p]));
  const sun = byPlanet.get("Sun")!;
  const moon = byPlanet.get("Moon")!;
  const isDay = isDaytimeBirth(birthDate, latitude, longitude);
  const navamsaByPlanet = new Map(divisionalCharts.D9.planets.map((p) => [p.planet, p]));

  return ASHTAKAVARGA_PLANETS.map((planet) => {
    const p = byPlanet.get(planet)!;

    const uchcha = uchchaBala(planet, p.siderealLongitude);
    const saptavargaja = saptavargajaBala(planet, divisionalCharts);
    const ojaYugma = ojaYugmaBala(planet, p.signIndex, navamsaByPlanet.get(planet)!.signIndex);
    const kendradi = kendradiBala(p.house);
    const drekkana = drekkanaBala(planet, p.degreeInSign);
    const sthanaBala = uchcha + saptavargaja + ojaYugma + kendradi + drekkana;

    const dig = digBala(planet, p.siderealLongitude, ascendantSiderealLongitude);

    const paksha = pakshaBala(planet, sun.siderealLongitude, moon.siderealLongitude);
    const nathonnata = nathonnataBala(planet, isDay);
    const kaala = nathonnata + paksha;

    const chesta = planet === "Sun" ? 0 : planet === "Moon" ? paksha : chestaBala(planet, birthDate);

    const naisargika = NAISARGIKA_BALA[planet];
    const drik = drikBala(p, planets);

    const totalVirupas = sthanaBala + dig + kaala + chesta + naisargika + drik;
    const rupas = totalVirupas / 60;
    const requiredRupas = REQUIRED_RUPAS[planet];

    return {
      planet,
      sthanaBala,
      digBala: dig,
      kaalaBala: kaala,
      chestaBala: chesta,
      naisargikaBala: naisargika,
      drikBala: drik,
      totalVirupas,
      rupas,
      requiredRupas,
      isStrong: rupas >= requiredRupas,
    };
  });
}
