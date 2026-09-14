import type { PlanetName } from "./constants";

/**
 * Classical Moolatrikona ranges (BPHS) — the degree span within a planet's
 * own-sign family that carries a dignity stronger than a plain Own Sign.
 * Only defined in the Rasi (D1) sense, since it depends on a real degree
 * within the sign, not just which sign a divisional chart places a planet in.
 */
const MOOLATRIKONA: Partial<Record<PlanetName, { signIndex: number; fromDegree: number; toDegree: number }>> = {
  Sun: { signIndex: 4, fromDegree: 0, toDegree: 20 }, // Leo 0-20°
  Moon: { signIndex: 1, fromDegree: 4, toDegree: 30 }, // Taurus 4-30°
  Mars: { signIndex: 0, fromDegree: 0, toDegree: 12 }, // Aries 0-12°
  Mercury: { signIndex: 5, fromDegree: 16, toDegree: 20 }, // Virgo 16-20°
  Jupiter: { signIndex: 8, fromDegree: 0, toDegree: 10 }, // Sagittarius 0-10°
  Venus: { signIndex: 6, fromDegree: 0, toDegree: 15 }, // Libra 0-15°
  Saturn: { signIndex: 10, fromDegree: 0, toDegree: 20 }, // Aquarius 0-20°
};

export function isMoolatrikona(planet: PlanetName, signIndex: number, degreeInSign: number): boolean {
  const range = MOOLATRIKONA[planet];
  if (!range) return false;
  return signIndex === range.signIndex && degreeInSign >= range.fromDegree && degreeInSign < range.toDegree;
}

export function moolatrikonaSignIndex(planet: PlanetName): number | undefined {
  return MOOLATRIKONA[planet]?.signIndex;
}

/** The full Moolatrikona range (sign + degree span) for a planet, if it has one. */
export function moolatrikonaRange(
  planet: PlanetName
): { signIndex: number; fromDegree: number; toDegree: number } | undefined {
  return MOOLATRIKONA[planet];
}
