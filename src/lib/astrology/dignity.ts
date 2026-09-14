import { SIGN_LORDS, type PlanetName, type SignName } from "./constants";
import { isMoolatrikona } from "./moolatrikona";

export type Dignity =
  | "Exalted"
  | "Debilitated"
  | "Moolatrikona"
  | "Own Sign"
  | "Friend's Sign"
  | "Enemy's Sign"
  | "Neutral Sign";

export const EXALTATION_SIGN: Partial<Record<PlanetName, number>> = {
  Sun: 0, // Aries
  Moon: 1, // Taurus
  Mars: 9, // Capricorn
  Mercury: 5, // Virgo
  Jupiter: 3, // Cancer
  Venus: 11, // Pisces
  Saturn: 6, // Libra
};

export const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], // Leo
  Moon: [3], // Cancer
  Mars: [0, 7], // Aries, Scorpio
  Mercury: [2, 5], // Gemini, Virgo
  Jupiter: [8, 11], // Sagittarius, Pisces
  Venus: [1, 6], // Taurus, Libra
  Saturn: [9, 10], // Capricorn, Aquarius
};

// Classical (Parashari) natural friendships among the seven grahas.
export const FRIENDS: Partial<Record<PlanetName, PlanetName[]>> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};

export const ENEMIES: Partial<Record<PlanetName, PlanetName[]>> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
};

/**
 * Dignity of a classical planet (Sun-Saturn) placed in a given sign.
 * Rahu/Ketu have no settled dignity rules and return null. `degreeInSign` is
 * optional — pass it (as the natal/Rasi computation does) to also resolve
 * Moolatrikona, which depends on an exact degree, not just the sign.
 */
export function getDignity(planet: PlanetName, signIndex: number, degreeInSign?: number): Dignity | null {
  if (planet === "Rahu" || planet === "Ketu") return null;

  if (EXALTATION_SIGN[planet] === signIndex) return "Exalted";
  if (EXALTATION_SIGN[planet] !== undefined && (EXALTATION_SIGN[planet]! + 6) % 12 === signIndex) return "Debilitated";
  if (degreeInSign !== undefined && isMoolatrikona(planet, signIndex, degreeInSign)) return "Moolatrikona";
  if (OWN_SIGNS[planet]?.includes(signIndex)) return "Own Sign";

  const signLord = SIGN_LORDS[signIndex] as PlanetName;
  if (FRIENDS[planet]?.includes(signLord)) return "Friend's Sign";
  if (ENEMIES[planet]?.includes(signLord)) return "Enemy's Sign";
  return "Neutral Sign";
}

export function dignityColorClass(dignity: Dignity | null): string {
  switch (dignity) {
    case "Exalted":
    case "Moolatrikona":
      return "text-gold-bright";
    case "Debilitated":
      return "text-rose";
    case "Own Sign":
      return "text-cream";
    default:
      return "text-muted";
  }
}

export type { SignName };
