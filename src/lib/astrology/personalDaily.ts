import { NAKSHATRAS, SIGNS, type PlanetName } from "./constants";
import { GOCHARA_GOOD } from "./transits";
import { periodsAt, type TreePeriod } from "./dashaTree";
import type { DailyTransits } from "./horoscope";
import type { KundaliChart } from "./types";

/**
 * A daily horoscope for one person rather than one sign. Classical muhurta
 * and gochara judge a day for an individual by:
 *  - Tarabala: the day's Moon nakshatra counted from the birth nakshatra;
 *  - Chandrabala: the day's Moon sign counted from the natal Moon;
 *  - gochara: every planet's transit house from the natal Moon, with its
 *    Ashtakavarga bindus deciding how strongly it delivers;
 *  - the running dasha lords, whose transits colour the day most.
 * Each factor adds or removes points, and every step is kept with its reason.
 */

export const TARAS = [
  { name: "Janma", good: false, meaning: "the birth star itself — a sensitive day for the body and mind; avoid big starts" },
  { name: "Sampat", good: true, meaning: "wealth — gains and good news come easily" },
  { name: "Vipat", good: false, meaning: "danger — obstacles and losses; postpone important work" },
  { name: "Kshema", good: true, meaning: "well-being — safe, steady progress" },
  { name: "Pratyak", good: false, meaning: "obstruction — people and plans resist you" },
  { name: "Sadhana", good: true, meaning: "achievement — efforts reach their goal" },
  { name: "Naidhana", good: false, meaning: "the most difficult tara — rest, don't risk anything important" },
  { name: "Mitra", good: true, meaning: "a friend — support and cooperation" },
  { name: "Param Mitra", good: true, meaning: "the best friend — the most helpful tara" },
] as const;

export const CHANDRABALA_GOOD = GOCHARA_GOOD.Moon;

/** How much each planet's transit weighs in the day's score. The Moon changes the day; slow planets set its background. */
const WEIGHT: Record<PlanetName, number> = { Moon: 12, Jupiter: 8, Saturn: 8, Sun: 5, Mars: 5, Mercury: 4, Venus: 4, Rahu: 3, Ketu: 2 };

export interface TransitRow {
  planet: PlanetName;
  signIndex: number;
  degree: number;
  retrograde: boolean;
  houseFromLagna: number;
  houseFromMoon: number;
  /** Favourable by classical gochara, counted from the natal Moon. */
  favourable: boolean;
  /** The planet's own Bhinnashtakavarga bindus in the transit sign (0–8), for the seven classical planets. */
  bindus: number | null;
  /** Sarvashtakavarga total for the transit sign (0–56, average 28). */
  sav: number;
  points: number;
  reason: string;
}

export interface ScoreStep {
  label: string;
  points: number;
  reason: string;
}

export interface PersonalDay {
  tarabala: { count: number; tara: (typeof TARAS)[number]; birthNakshatra: string; todayNakshatra: string };
  chandrabala: { house: number; good: boolean };
  transits: TransitRow[];
  dasha: { chain: TreePeriod[]; lordNotes: string[] };
  steps: ScoreStep[];
  /** 0–100 */
  score: number;
  /** 1–5 */
  stars: number;
  /** Houses from the Lagna that today's Moon lights up. */
  moonHouseFromLagna: number;
}

const house = (sign: number, from: number) => ((sign - from + 12) % 12) + 1;
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export function personalDay(chart: KundaliChart, t: DailyTransits, at: Date): PersonalDay {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const lagna = chart.ascendant.signIndex;
  const steps: ScoreStep[] = [];

  // Tarabala
  const todayNak = NAKSHATRAS.indexOf(t.moonNakshatra as (typeof NAKSHATRAS)[number]);
  const count = ((todayNak - moon.nakshatraIndex + 27) % 27) + 1;
  const tara = TARAS[(count - 1) % 9];
  steps.push({
    label: `Tarabala: ${tara.name}`,
    points: tara.good ? 12 : tara.name === "Naidhana" || tara.name === "Vipat" ? -14 : -8,
    reason: `Today's Moon is in ${t.moonNakshatra}, the ${ordinal(count)} nakshatra from your birth star ${moon.nakshatra}. Counting in nines gives ${tara.name} tara, ${tara.meaning}.`,
  });

  // Chandrabala
  const cbHouse = house(t.moonSignIndex, moon.signIndex);
  const cbGood = CHANDRABALA_GOOD.includes(cbHouse);
  steps.push({
    label: `Chandrabala: ${ordinal(cbHouse)} from your Moon`,
    points: cbGood ? 10 : cbHouse === 8 ? -14 : -6,
    reason: `The Moon is in ${SIGNS[t.moonSignIndex]}, the ${ordinal(cbHouse)} sign from your natal Moon in ${moon.sign}. ${
      cbGood ? "That is one of the Moon's good houses (1, 3, 6, 7, 10, 11), so the mind is supported." : cbHouse === 8 ? "This is Chandrashtama, the Moon's hardest house — keep the day light and avoid disputes." : "That is not one of the Moon's good houses (1, 3, 6, 7, 10, 11), so moods and plans need more care."
    }`,
  });

  // Gochara with Ashtakavarga
  const transits: TransitRow[] = t.positions.map((p) => {
    const fromMoon = house(p.signIndex, moon.signIndex);
    const fromLagna = house(p.signIndex, lagna);
    const favourable = GOCHARA_GOOD[p.planet].includes(fromMoon);
    const bav = (chart.ashtakavarga.bhinna as Record<string, number[]>)[p.planet];
    const bindus = bav ? bav[p.signIndex] : null;
    const sav = chart.ashtakavarga.sarva[p.signIndex];
    // Bindus refine gochara: 4+ of 8 lets a planet deliver its good results; fewer weakens them.
    const strength = bindus === null ? (sav >= 28 ? 1 : 0.6) : bindus >= 5 ? 1.2 : bindus === 4 ? 1 : 0.6;
    const base = favourable ? WEIGHT[p.planet] : -WEIGHT[p.planet] * 0.6;
    const points = Math.round(favourable ? base * strength : base * (bindus !== null && bindus >= 5 ? 0.5 : 1));
    const topic = HOUSE_TOPIC[fromLagna];
    const reason =
      `${p.planet} is in ${SIGNS[p.signIndex]}, your ${ordinal(fromMoon)} from the Moon and ${ordinal(fromLagna)} from the Lagna (${topic}). ` +
      (favourable ? `Gochara counts the ${ordinal(fromMoon)} as good for ${p.planet}` : `The ${ordinal(fromMoon)} is not among ${p.planet}'s good houses (${GOCHARA_GOOD[p.planet].join(", ")})`) +
      (bindus !== null
        ? `, and it has ${bindus} of 8 bindus here${bindus >= 5 ? ", so its effect is strong" : bindus === 4 ? ", an average strength" : ", which weakens what it can give"}.`
        : `; the sign holds ${sav} Sarvashtakavarga bindus (28 is average).`);
    return { planet: p.planet, signIndex: p.signIndex, degree: p.longitude % 30, retrograde: p.retrograde, houseFromLagna: fromLagna, houseFromMoon: fromMoon, favourable, bindus, sav, points, reason };
  });
  for (const r of transits) steps.push({ label: `${r.planet} transit`, points: r.points, reason: r.reason });

  // Dasha lords in transit
  const chain = periodsAt(chart.dashas, at, 3);
  const lordNotes: string[] = [];
  chain.forEach((p, i) => {
    const r = transits.find((x) => x.planet === p.lord)!;
    const level = ["Mahadasha", "Antardasha", "Pratyantardasha"][i];
    const pts = r.favourable ? 4 - i : -(4 - i);
    lordNotes.push(
      `${p.lord} runs your ${level}. It is transiting your ${ordinal(r.houseFromLagna)} house from the Lagna (${HOUSE_TOPIC[r.houseFromLagna]}), ${r.favourable ? "a good gochara position, so the period's promise flows more easily today" : "not a good gochara position, so the period's themes feel heavier today"}.`
    );
    steps.push({ label: `${level} lord ${p.lord}`, points: pts, reason: lordNotes[lordNotes.length - 1] });
  });

  // Moon in a sign with many bindus lifts the day.
  const moonSav = chart.ashtakavarga.sarva[t.moonSignIndex];
  steps.push({
    label: `Moon's sign holds ${moonSav} bindus`,
    points: moonSav >= 30 ? 5 : moonSav <= 24 ? -5 : 0,
    reason: `${SIGNS[t.moonSignIndex]} has ${moonSav} Sarvashtakavarga bindus in your chart (28 is average). ${moonSav >= 30 ? "Transits through strong signs deliver well." : moonSav <= 24 ? "Transits through weak signs deliver less." : "An average sign, so no adjustment."}`,
  });

  const raw = steps.reduce((a, s) => a + s.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(46 + raw)));
  const stars = score >= 80 ? 5 : score >= 62 ? 4 : score >= 45 ? 3 : score >= 30 ? 2 : 1;

  return {
    tarabala: { count, tara, birthNakshatra: moon.nakshatra, todayNakshatra: t.moonNakshatra },
    chandrabala: { house: cbHouse, good: cbGood },
    transits,
    dasha: { chain, lordNotes },
    steps,
    score,
    stars,
    moonHouseFromLagna: house(t.moonSignIndex, lagna),
  };
}

/** Short house themes for inline explanations. */
export const HOUSE_TOPIC: Record<number, string> = {
  1: "self and health",
  2: "money and family",
  3: "effort, siblings and short trips",
  4: "home, mother and peace of mind",
  5: "children, study and romance",
  6: "work, health routines and rivals",
  7: "partner and dealings with others",
  8: "sudden events and hidden matters",
  9: "luck, teachers and long journeys",
  10: "career and status",
  11: "gains, friends and wishes",
  12: "expenses, rest and faraway places",
};

