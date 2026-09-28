import { DateTime } from "luxon";
import { SIGN_LORDS, type PlanetName } from "./constants";
import { calculateKundali } from "./kundali";
import { kpAnalysis } from "./kp";
import { getAspectedHouses } from "./aspects";
import type { KundaliChart } from "./types";

/**
 * Prashna (horary): the chart of the moment a sincere question is asked
 * answers it, so it needs no birth details. The answer combines:
 *  - KP: the sub lord of the question's cusp must signify the houses that
 *    give the result, not those that deny it (the primary judgement);
 *  - Parashari: the Lagna lord (the one asking) linked to the lord of the
 *    question's house (the matter asked about);
 *  - the Moon — the mind behind the question — well placed and waxing;
 *  - benefics rather than malefics holding the angles;
 *  - the ruling planets of the moment among the question's significators.
 */

export { PRASHNA_TOPICS } from "./prashnaTopics";
export type { PrashnaTopic, PrashnaFactor, PrashnaResult } from "./prashnaTopics";
import { PRASHNA_TOPICS, type PrashnaFactor, type PrashnaResult, type PrashnaTopic } from "./prashnaTopics";

const BENEFICS = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);
const MALEFICS = new Set<PlanetName>(["Saturn", "Mars", "Rahu", "Ketu", "Sun"]);
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export function askPrashna(topic: PrashnaTopic, place: { latitude: number; longitude: number; timezone: string; place: string }, now = new Date()): PrashnaResult {
  const t = DateTime.fromJSDate(now, { zone: place.timezone });
  const chart: KundaliChart = calculateKundali({ name: "Prashna", date: t.toISODate()!, time: t.toFormat("HH:mm"), ...place });
  const def = PRASHNA_TOPICS[topic];
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const factors: PrashnaFactor[] = [];
  let score = 0;

  // 1. KP cusp sub lord (weighted double — the primary horary judgement)
  const kp = kpAnalysis(chart, now);
  const csl = kp.cusps[def.house - 1].subLord as PlanetName;
  const sig = kp.planets.find((p) => p.planet === csl)!.signifies;
  const hits = def.favourable.filter((h) => sig.includes(h));
  const blocks = def.negating.filter((h) => sig.includes(h));
  const kpPositive = hits.length > blocks.length;
  score += kpPositive ? 2 : hits.length && hits.length === blocks.length ? 0 : -2;
  factors.push({
    name: "KP cusp sub lord",
    positive: kpPositive ? true : hits.length === blocks.length && hits.length ? null : false,
    text: `The ${ord(def.house)} cusp's sub lord is ${csl}, which signifies houses ${sig.join(", ")} — ${hits.length ? `${hits.length > 1 ? "houses" : "house"} ${hits.join(", ")} ${hits.length > 1 ? "give" : "gives"} the result` : "none of the houses that give the result"}${blocks.length ? `; ${blocks.length > 1 ? "houses" : "house"} ${blocks.join(", ")} ${blocks.length > 1 ? "deny or delay" : "denies or delays"} it` : ""}.`,
  });

  // 2. Lagna lord and the matter's lord
  const lagna = chart.ascendant.signIndex;
  const l1 = P.get(SIGN_LORDS[lagna] as PlanetName)!;
  const lh = P.get(SIGN_LORDS[(lagna + def.house - 1) % 12] as PlanetName)!;
  const aspects = (a: typeof l1, b: typeof l1) => getAspectedHouses(a.planet).includes(((b.signIndex - a.signIndex + 12) % 12) + 1);
  const linked =
    def.house === 1 ||
    l1.planet === lh.planet ||
    l1.signIndex === lh.signIndex ||
    aspects(l1, lh) ||
    aspects(lh, l1) ||
    (SIGN_LORDS[l1.signIndex] === lh.planet && SIGN_LORDS[lh.signIndex] === l1.planet);
  score += linked ? 1 : -1;
  factors.push({
    name: "You and the matter",
    positive: linked,
    text: linked
      ? `The Lagna lord ${l1.planet} (you) is linked with ${lh.planet}, lord of the ${ord(def.house)} (the matter) — the two come together.`
      : `The Lagna lord ${l1.planet} (you) has no link with ${lh.planet}, lord of the ${ord(def.house)} (the matter).`,
  });

  // 3. The Moon
  const moon = P.get("Moon")!;
  const sun = P.get("Sun")!;
  const waxing = (moon.siderealLongitude - sun.siderealLongitude + 360) % 360 < 180;
  const moonBad = [6, 8, 12].includes(moon.house);
  const moonGood = [1, 4, 5, 7, 9, 10, 11].includes(moon.house);
  score += (moonGood ? 1 : moonBad ? -1 : 0) + (waxing ? 0.5 : -0.5);
  factors.push({
    name: "The Moon (your mind)",
    positive: moonGood && waxing ? true : moonBad ? false : null,
    text: `The Moon is ${waxing ? "waxing" : "waning"} in the ${ord(moon.house)} house${moonBad ? ", a hidden or difficult house — obstacles or worry surround the matter" : moonGood ? ", a strong position" : ""}.`,
  });

  // 4. Angles
  const inKendra = chart.planets.filter((p) => [1, 4, 7, 10].includes(p.house));
  const good = inKendra.filter((p) => BENEFICS.has(p.planet)).map((p) => p.planet);
  const bad = inKendra.filter((p) => MALEFICS.has(p.planet)).map((p) => p.planet);
  score += good.length > bad.length ? 1 : bad.length > good.length ? -1 : 0;
  factors.push({
    name: "The angles",
    positive: good.length > bad.length ? true : bad.length > good.length ? false : null,
    text: inKendra.length ? `${good.length ? `Benefics ${good.join(", ")}` : "No benefic"} and ${bad.length ? `malefics ${bad.join(", ")}` : "no malefic"} hold the angles.` : "The angles are empty.",
  });

  // 5. Ruling planets as confirmation
  const rp = new Set(kp.rulingPlanets.list.map((r) => r.planet));
  const sigs = kp.planets.filter((p) => def.favourable.some((h) => p.signifies.includes(h)) && rp.has(p.planet)).map((p) => p.planet);
  if (sigs.length) score += 0.5;
  factors.push({
    name: "Ruling planets",
    positive: sigs.length ? true : null,
    text: sigs.length ? `${sigs.join(", ")} rule this moment and also signify the result — a confirmation.` : "None of the moment's ruling planets signifies the result directly.",
  });

  const answer: PrashnaResult["answer"] = score >= 3.5 ? "Yes" : score >= 1.5 ? "Likely yes" : score >= -0.5 ? "Uncertain" : "Unlikely";
  return {
    askedAt: now,
    topic,
    question: def.label,
    answer,
    score,
    factors,
    chart: { ascendant: chart.ascendant.sign, moonSign: moon.sign, moonNakshatra: moon.nakshatra },
    advice:
      answer === "Yes" || answer === "Likely yes"
        ? "Go ahead and put in the effort — the moment supports the outcome."
        : answer === "Uncertain"
          ? "The outcome depends on your effort and timing; ask again after the situation changes, not the same day."
          : "The moment doesn't support the outcome as things stand; reconsider the approach or wait.",
  };
}
