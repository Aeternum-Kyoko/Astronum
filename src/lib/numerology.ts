import type { PlanetName } from "@/lib/astrology/constants";

/**
 * Indian (Vedic-style) numerology: every number reduces to a single digit 1–9,
 * each ruled by a graha. Moolank comes from the day of birth, Bhagyank from the
 * full date, and the name number from Chaldean letter values.
 */

const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

export function reduceToDigit(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) x = String(x).split("").reduce((sum, d) => sum + Number(d), 0);
  return x;
}

/** Psychic number — the day of the month you were born, reduced. */
export function moolank(date: string): number {
  return reduceToDigit(Number(date.slice(8, 10)));
}

/** Destiny number — every digit of the full birth date, reduced. */
export function bhagyank(date: string): number {
  return reduceToDigit(date.replace(/\D/g, "").split("").reduce((sum, d) => sum + Number(d), 0));
}

/** Chaldean name number; letters outside A–Z (spaces, dots) are ignored. Returns the compound total and its digit. */
export function nameNumber(name: string): { compound: number; digit: number } {
  const compound = name
    .toUpperCase()
    .split("")
    .reduce((sum, ch) => sum + (CHALDEAN[ch] ?? 0), 0);
  return { compound, digit: reduceToDigit(compound) };
}

export interface NumberMeaning {
  planet: PlanetName;
  keywords: string;
  description: string;
  day: string;
  colours: string;
}

export const NUMBER_MEANINGS: Record<number, NumberMeaning> = {
  1: {
    planet: "Sun",
    keywords: "Leadership, independence, ambition",
    description: "A natural leader who likes to take charge and be original. Confident and driven, though it can tip into pride or impatience with others.",
    day: "Sunday",
    colours: "Gold, orange, yellow",
  },
  2: {
    planet: "Moon",
    keywords: "Sensitivity, diplomacy, imagination",
    description: "Gentle, intuitive and cooperative, at your best in partnership. Deeply feeling, which brings empathy but also changeable moods.",
    day: "Monday",
    colours: "White, cream, silver",
  },
  3: {
    planet: "Jupiter",
    keywords: "Wisdom, optimism, expansion",
    description: "Generous, principled and fond of learning and teaching. Respected for good judgement; watch a tendency to be overconfident or preachy.",
    day: "Thursday",
    colours: "Yellow, saffron",
  },
  4: {
    planet: "Rahu",
    keywords: "Originality, hard work, the unconventional",
    description: "Practical and hardworking with a streak of rebellion and unconventional thinking. Life brings sudden turns that reward persistence.",
    day: "Saturday",
    colours: "Blue, grey",
  },
  5: {
    planet: "Mercury",
    keywords: "Intelligence, communication, adaptability",
    description: "Quick-witted, curious and good with people, words and trade. Loves variety and movement; restlessness is the flip side.",
    day: "Wednesday",
    colours: "Green",
  },
  6: {
    planet: "Venus",
    keywords: "Love, beauty, harmony",
    description: "Warm, artistic and devoted to home and relationships. Enjoys comfort and beauty; needs to guard against indulgence.",
    day: "Friday",
    colours: "White, light blue, pink",
  },
  7: {
    planet: "Ketu",
    keywords: "Introspection, spirituality, insight",
    description: "Thoughtful, intuitive and drawn to deeper questions and solitude. Insightful and independent, if sometimes detached.",
    day: "Tuesday",
    colours: "Light green, smoky grey",
  },
  8: {
    planet: "Saturn",
    keywords: "Discipline, endurance, justice",
    description: "Serious, responsible and capable of great endurance. Success tends to come later and through sustained effort, and it lasts.",
    day: "Saturday",
    colours: "Dark blue, black",
  },
  9: {
    planet: "Mars",
    keywords: "Courage, energy, humanitarianism",
    description: "Bold, energetic and protective, ready to fight for a cause. Generous and brave; needs to channel a quick temper.",
    day: "Tuesday",
    colours: "Red, coral",
  },
};
