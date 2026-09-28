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

// ——— Friendly numbers ————————————————————————————————————————————

/** Numbers that support each root number in Indian numerology (by the friendship of their ruling planets). */
export const FRIENDLY: Record<number, number[]> = {
  1: [1, 2, 3, 5, 6, 9],
  2: [1, 2, 3, 5],
  3: [1, 2, 3, 5, 7, 9],
  4: [1, 5, 6, 7],
  5: [1, 2, 3, 5, 6],
  6: [1, 5, 6, 7, 9],
  7: [1, 3, 4, 5, 6],
  8: [3, 5, 6, 7],
  9: [1, 2, 3, 5, 6, 9],
};

const suits = (n: number, moolankN: number, bhagyankN: number) => FRIENDLY[moolankN].includes(n) && FRIENDLY[bhagyankN].includes(n);

// ——— Lo Shu grid —————————————————————————————————————————————————

export const LO_SHU_LAYOUT = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

const PLANES: { name: string; numbers: number[]; meaning: string }[] = [
  { name: "Mental plane", numbers: [4, 9, 2], meaning: "sharp memory, intellect and analysis" },
  { name: "Emotional plane", numbers: [3, 5, 7], meaning: "emotional balance and intuition" },
  { name: "Practical plane", numbers: [8, 1, 6], meaning: "practical skill, material success and organisation" },
  { name: "Thought plane", numbers: [4, 3, 8], meaning: "planning and ideas" },
  { name: "Will plane", numbers: [9, 5, 1], meaning: "determination and willpower" },
  { name: "Action plane", numbers: [2, 7, 6], meaning: "turning ideas into action" },
  { name: "Golden (Raj Yoga) plane", numbers: [4, 5, 6], meaning: "success, fame and prosperity" },
  { name: "Property plane", numbers: [8, 5, 2], meaning: "property, wealth and stability" },
];

const MISSING_MEANING: Record<number, string> = {
  1: "Communication and self-expression need effort.",
  2: "Sensitivity and intuition may be low; patience helps.",
  3: "Imagination and planning may need support.",
  4: "Discipline and organisation don't come easily.",
  5: "Emotional balance and flexibility need work.",
  6: "Home and family responsibility may feel heavy.",
  7: "Luck feels delayed; lessons come through experience.",
  8: "Money management and attention to detail need care.",
  9: "Ambition and humanitarian drive may need a push.",
};

export interface LoShu {
  counts: Record<number, number>;
  planes: { name: string; numbers: number[]; complete: boolean; meaning: string }[];
  missing: { number: number; meaning: string }[];
  repeated: { number: number; count: number }[];
}

/** Lo Shu grid from the birth date, with the Moolank and Bhagyank added as Indian numerology does. */
export function loShu(date: string): LoShu {
  const digits = date.replace(/\D/g, "").split("").map(Number).filter((d) => d > 0);
  digits.push(moolank(date), bhagyank(date));
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const d of digits) counts[d]++;
  return {
    counts,
    planes: PLANES.map((p) => ({ ...p, complete: p.numbers.every((n) => counts[n] > 0) })),
    missing: Object.keys(counts).map(Number).filter((n) => counts[n] === 0).map((n) => ({ number: n, meaning: MISSING_MEANING[n] })),
    repeated: Object.keys(counts).map(Number).filter((n) => counts[n] >= 3).map((n) => ({ number: n, count: counts[n] })),
  };
}

// ——— Name correction ————————————————————————————————————————————————

export interface NameSuggestion {
  spelling: string;
  compound: number;
  digit: number;
  change: string;
}

/** Small spelling changes that bring the name number into harmony with both Moolank and Bhagyank. */
export function nameSuggestions(name: string, date: string, limit = 8): { current: { compound: number; digit: number; suits: boolean }; suggestions: NameSuggestion[] } {
  const m = moolank(date);
  const b = bhagyank(date);
  const cur = nameNumber(name);
  const first = name.trim().split(/\s+/)[0];
  const rest = name.trim().slice(first.length);
  const variants = new Map<string, string>();
  const add = (v: string, change: string) => {
    if (v.toLowerCase() !== first.toLowerCase() && !variants.has(v)) variants.set(v, change);
  };
  for (let i = 1; i < first.length; i++) {
    const ch = first[i];
    add(first.slice(0, i + 1) + ch + first.slice(i + 1), `double the "${ch}"`);
    if ("aeiou".includes(ch.toLowerCase()) && first[i + 1] === ch) add(first.slice(0, i) + first.slice(i + 1), `drop one "${ch}"`);
  }
  for (const end of ["a", "h", "e", "i", "y"]) add(first + end, `add "${end}" at the end`);
  for (let i = 1; i < first.length; i++) if ("aeiou".includes(first[i].toLowerCase())) add(first.slice(0, i) + first[i] + "a" + first.slice(i + 1), `add "a" after "${first[i]}"`);

  const suggestions = [...variants.entries()]
    .map(([v, change]) => ({ spelling: v + rest, change, ...nameNumber(v + rest) }))
    .filter((s) => suits(s.digit, m, b) && s.digit !== 4 && s.digit !== 8)
    .sort((x, y) => x.spelling.length - y.spelling.length)
    .slice(0, limit);
  return { current: { ...cur, suits: suits(cur.digit, m, b) }, suggestions };
}

// ——— Mobile number ——————————————————————————————————————————————————

export interface MobileReading {
  total: number;
  digit: number;
  suits: boolean;
  notes: string[];
  verdict: "Lucky" | "Neutral" | "Not ideal";
}

export function mobileNumerology(phone: string, date: string): MobileReading {
  const digits = phone.replace(/\D/g, "").slice(-10).split("").map(Number);
  const total = digits.reduce((a, d) => a + d, 0);
  const digit = reduceToDigit(total);
  const m = moolank(date);
  const b = bhagyank(date);
  const ok = suits(digit, m, b);
  const notes = [`The digits add to ${total}, which reduces to ${digit} (${NUMBER_MEANINGS[digit].planet}).`];
  notes.push(ok ? `${digit} is friendly to your Moolank ${m} and Bhagyank ${b}.` : `${digit} is not friendly to ${FRIENDLY[m].includes(digit) ? `your Bhagyank ${b}` : `your Moolank ${m}`}.`);
  const zeros = digits.filter((d) => d === 0).length;
  if (zeros >= 3) notes.push(`${zeros} zeros weaken the number's energy.`);
  const eights = digits.filter((d) => d === 8).length;
  if (eights >= 3) notes.push(`${eights} eights can bring delays and struggle.`);
  const lastFour = digits.slice(-4);
  if (lastFour.length === 4 && lastFour.every((d) => d === lastFour[0])) notes.push("The last four digits repeat one number — it strongly amplifies that number.");
  const verdict: MobileReading["verdict"] = ok && zeros < 3 && eights < 3 ? "Lucky" : ok || digit === m || digit === b ? "Neutral" : "Not ideal";
  return { total, digit, suits: ok, notes, verdict };
}
