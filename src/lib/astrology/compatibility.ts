import { SIGN_LORDS, type PlanetName } from "./constants";
import { computeGunaMilan, grahaMaitriScore, naturalRelation } from "./matching";
import { signOffsetHouse } from "./math";
import type { KundaliChart, PlanetPlacement } from "./types";

/**
 * Compatibility for relationships other than marriage — business partners,
 * friends and romantic interest. Ashtakoota (Guna Milan) was designed for
 * marriage, so these reports adapt its classical building blocks to each
 * purpose and add chart-to-chart overlays (one person's planets falling in the
 * other's houses):
 *   - the relationship between the two Moon signs (the Bhakoot principle),
 *   - planetary friendship between the Moon-sign lords and Lagna lords,
 *   - Tara, Gana, Vashya and Yoni where they bear on that relationship,
 *   - house overlays and planet-to-planet contacts suited to its purpose,
 *   - and, for business, whether each person's current dasha supports work and gains.
 * Every checkpoint is weighted; the weights for each type total 100.
 */

export type RelationshipType = "business" | "friendship" | "romance";
export const RELATIONSHIP_TYPES: RelationshipType[] = ["romance", "business", "friendship"];

export type Verdict = "Strong" | "Good" | "Neutral" | "Caution" | "Challenging";

export interface Checkpoint {
  key: string;
  title: string;
  /** What this checkpoint tells you about the relationship. */
  measures: string;
  points: number;
  max: number;
  verdict: Verdict;
  detail: string;
}

export interface CompatibilityResult {
  type: RelationshipType;
  score: number; // 0–100
  label: "Excellent" | "Good" | "Workable" | "Challenging";
  summary: string;
  checkpoints: Checkpoint[];
  strengths: string[];
  cautions: string[];
}

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const planet = (c: KundaliChart, p: PlanetName) => c.planets.find((x) => x.planet === p)!;

function verdictFor(ratio: number): Verdict {
  return ratio >= 0.8 ? "Strong" : ratio >= 0.6 ? "Good" : ratio >= 0.4 ? "Neutral" : ratio >= 0.2 ? "Caution" : "Challenging";
}

function checkpoint(key: string, title: string, measures: string, max: number, ratio: number, detail: string): Checkpoint {
  const r = Math.max(0, Math.min(1, ratio));
  return { key, title, measures, max, points: Math.round(r * max * 10) / 10, verdict: verdictFor(r), detail };
}

/** "3/11"-style distance between two signs, counted inclusively both ways. */
function signPair(a: number, b: number): string {
  const x = signOffsetHouse(b, a);
  const y = signOffsetHouse(a, b);
  return [x, y].sort((m, n) => m - n).join("/");
}

/** How strongly two placements connect by sign: conjunction, opposition (7th), trine (5/9), or not at all. */
function contact(a: PlanetPlacement, b: PlanetPlacement): { strength: number; kind: string } | null {
  const pair = signPair(a.signIndex, b.signIndex);
  if (pair === "1/1") return { strength: 1, kind: "in the same sign" };
  if (pair === "7/7") return { strength: 0.85, kind: "opposite each other (7th)" };
  if (pair === "5/9") return { strength: 0.6, kind: "in trine (5th/9th)" };
  return null;
}

/** House of B's chart that A's planet falls in, counted from B's Lagna. */
const houseInOther = (from: PlanetPlacement, other: KundaliChart) => signOffsetHouse(from.signIndex, other.ascendant.signIndex);

// Moon-sign relationship tables by purpose (1.0 = best). 2/12 and 6/8 are the classically difficult pairings.
const MOON_PAIR: Record<RelationshipType, Record<string, number>> = {
  business: { "1/1": 0.75, "7/7": 0.75, "3/11": 1, "4/10": 1, "5/9": 0.85, "2/12": 0.3, "6/8": 0 },
  friendship: { "1/1": 0.8, "7/7": 0.7, "3/11": 1, "4/10": 0.7, "5/9": 1, "2/12": 0.35, "6/8": 0 },
  romance: { "1/1": 0.75, "7/7": 1, "3/11": 0.8, "4/10": 0.7, "5/9": 1, "2/12": 0.35, "6/8": 0 },
};

const PAIR_WORDS: Record<string, string> = {
  "1/1": "the same sign — easy understanding, but also shared blind spots",
  "7/7": "opposite signs — complementary, each supplies what the other lacks",
  "3/11": "3rd and 11th from each other — mutual support and shared gains",
  "4/10": "4th and 10th from each other — one steadies, the other drives",
  "5/9": "in trine — natural goodwill and shared values",
  "2/12": "2nd and 12th from each other — a subtle drain; money and priorities need clarity",
  "6/8": "6th and 8th from each other — the most friction-prone pairing, needing conscious effort",
};

function moonRelationship(type: RelationshipType, a: KundaliChart, b: KundaliChart, max: number): Checkpoint {
  const am = planet(a, "Moon");
  const bm = planet(b, "Moon");
  const pair = signPair(am.signIndex, bm.signIndex);
  return checkpoint(
    "moon",
    "Moon signs",
    "Emotional rhythm and day-to-day understanding",
    max,
    MOON_PAIR[type][pair],
    `Moons in ${am.sign} and ${bm.sign}: ${PAIR_WORDS[pair]}.`
  );
}

function grahaMaitri(a: KundaliChart, b: KundaliChart, max: number, measures: string): Checkpoint {
  const la = SIGN_LORDS[planet(a, "Moon").signIndex];
  const lb = SIGN_LORDS[planet(b, "Moon").signIndex];
  const score = grahaMaitriScore(la, lb);
  const rel = la === lb ? "the same planet" : `${naturalRelation(la, lb).toLowerCase()} and ${naturalRelation(lb, la).toLowerCase()} to each other`;
  return checkpoint("maitri", "Moon-sign lords (Graha Maitri)", measures, max, score / 5, `The Moon signs are ruled by ${la} and ${lb} — ${rel}.`);
}

function lagnaLords(a: KundaliChart, b: KundaliChart, max: number): Checkpoint {
  const la = SIGN_LORDS[a.ascendant.signIndex];
  const lb = SIGN_LORDS[b.ascendant.signIndex];
  const score = grahaMaitriScore(la, lb);
  return checkpoint(
    "lagna",
    "Lagna lords",
    "Working style and how each approaches life",
    max,
    score / 5,
    `Lagnas in ${a.ascendant.sign} (lord ${la}) and ${b.ascendant.sign} (lord ${lb}) — ${la === lb ? "the same planet" : `${naturalRelation(la, lb).toLowerCase()} and ${naturalRelation(lb, la).toLowerCase()} to each other`}.`
  );
}

/** Ashtakoota kootas are asymmetric for some tables, so average both directions for non-marriage use. */
function koota(a: KundaliChart, b: KundaliChart, name: string): { ratio: number; aValue: string; bValue: string } {
  const ab = computeGunaMilan(planet(a, "Moon"), planet(b, "Moon")).kootas.find((k) => k.name === name)!;
  const ba = computeGunaMilan(planet(b, "Moon"), planet(a, "Moon")).kootas.find((k) => k.name === name)!;
  return { ratio: (ab.score + ba.score) / 2 / ab.max, aValue: ab.boy, bValue: ab.girl };
}

function kootaCheckpoint(a: KundaliChart, b: KundaliChart, name: string, title: string, measures: string, max: number): Checkpoint {
  const k = koota(a, b, name);
  return checkpoint(name.toLowerCase(), title, measures, max, k.ratio, `${k.aValue} and ${k.bValue}.`);
}

interface OverlayRule {
  planets: PlanetName[];
  houses: number[];
}

/** One person's chosen planets landing in chosen houses of the other's chart, checked both ways. */
function overlays(a: KundaliChart, b: KundaliChart, rule: OverlayRule, names: [string, string]): string[] {
  const hits: string[] = [];
  for (const [from, to, fromName, toName] of [
    [a, b, names[0], names[1]],
    [b, a, names[1], names[0]],
  ] as const) {
    for (const p of rule.planets) {
      const house = houseInOther(planet(from, p), to);
      if (rule.houses.includes(house)) hits.push(`${fromName}'s ${p} falls in ${toName}'s ${ordinal(house)} house`);
    }
  }
  return hits;
}

function pressure(a: KundaliChart, b: KundaliChart, heavy: PlanetName[], sensitive: PlanetName[], names: [string, string]): string[] {
  const out: string[] = [];
  for (const [x, y, xn, yn] of [
    [a, b, names[0], names[1]],
    [b, a, names[1], names[0]],
  ] as const) {
    for (const h of heavy) for (const s of sensitive) {
      if (planet(x, h).signIndex === planet(y, s).signIndex) out.push(`${xn}'s ${h} sits on ${yn}'s ${s}`);
    }
  }
  return out;
}

/** Each person's Moon and Lagna lord landing in the other's 7th, 10th or 11th house (partnership, career, gains). */
function partnershipLinks(a: KundaliChart, b: KundaliChart, names: [string, string]): string[] {
  const hits: string[] = [];
  for (const [from, to, fromName, toName] of [
    [a, b, names[0], names[1]],
    [b, a, names[1], names[0]],
  ] as const) {
    const lagnaLord = SIGN_LORDS[from.ascendant.signIndex];
    for (const p of new Set<PlanetName>(["Moon", lagnaLord])) {
      const house = houseInOther(planet(from, p), to);
      if ([7, 10, 11].includes(house)) hits.push(`${fromName}'s ${p === lagnaLord && p !== "Moon" ? `Lagna lord ${p}` : p} falls in ${toName}'s ${ordinal(house)} house`);
    }
  }
  return hits;
}

function dashaSupportsWork(c: KundaliChart): boolean {
  const lord = c.currentDasha?.lord as PlanetName | undefined;
  if (!lord) return false;
  const rules = c.houseLords.filter((h) => h.lord === lord).map((h) => h.house);
  return [2, 10, 11].includes(planet(c, lord).house) || rules.some((h) => [1, 2, 10, 11].includes(h));
}

export function computeCompatibility(type: RelationshipType, a: KundaliChart, b: KundaliChart): CompatibilityResult {
  const names: [string, string] = [a.input.name || "Person A", b.input.name || "Person B"];
  let checkpoints: Checkpoint[] = [];

  if (type === "business") {
    const wealth = overlays(a, b, { planets: ["Jupiter", "Venus", "Mercury"], houses: [2, 10, 11] }, names);
    const partner = partnershipLinks(a, b, names);
    const mercury = contact(planet(a, "Mercury"), planet(b, "Mercury"));
    const mercuryPair = signPair(planet(a, "Mercury").signIndex, planet(b, "Mercury").signIndex);
    const strain = pressure(a, b, ["Saturn", "Mars"], ["Moon", "Mercury"], names);
    const timing = [dashaSupportsWork(a), dashaSupportsWork(b)];
    checkpoints = [
      moonRelationship(type, a, b, 15),
      grahaMaitri(a, b, 15, "Trust and how easily you understand each other's thinking"),
      lagnaLords(a, b, 10),
      kootaCheckpoint(a, b, "Tara", "Birth stars (Tara)", "Whether you bring each other luck and well-being", 8),
      kootaCheckpoint(a, b, "Gana", "Temperament (Gana)", "How your temperaments hold up under pressure", 10),
      checkpoint(
        "mercury",
        "Mercury — the planet of commerce",
        "Communication, negotiation and decision-making together",
        10,
        mercury ? mercury.strength : ["3/11", "4/10"].includes(mercuryPair) ? 0.7 : mercuryPair === "6/8" ? 0.1 : 0.4,
        mercury ? `Your Mercuries are ${mercury.kind}, so you tend to think and negotiate on the same wavelength.` : `Your Mercuries are ${mercuryPair.replace("/", " and ")} signs apart.`
      ),
      checkpoint(
        "wealth",
        "Wealth overlays",
        "Whether each of you tends to bring the other gains",
        12,
        wealth.length / 3,
        wealth.length ? `${wealth.join("; ")} — houses of money, career and gains.` : "Neither person's Jupiter, Venus or Mercury falls in the other's 2nd, 10th or 11th house."
      ),
      checkpoint(
        "partnership",
        "Partnership links",
        "How naturally you see each other as partners in work",
        10,
        partner.length / 2,
        partner.length ? `${partner.join("; ")} — the houses of partnership, career and gains.` : "No Moon or Lagna-lord overlay links the partnership, career or gains houses."
      ),
      checkpoint(
        "strain",
        "Pressure points",
        "Where one person's Saturn or Mars weighs on the other's mind or judgement",
        5,
        strain.length === 0 ? 1 : strain.length === 1 ? 0.5 : 0,
        strain.length ? `${strain.join("; ")} — expect friction or pressure there.` : "No Saturn or Mars sits on the other's Moon or Mercury."
      ),
      checkpoint(
        "timing",
        "Current timing",
        "Whether each person's running dasha supports work and gains now",
        5,
        (Number(timing[0]) + Number(timing[1])) / 2,
        `${names[0]} is running ${a.currentDasha?.lord ?? "—"} Mahadasha (${timing[0] ? "supports" : "does not especially support"} work and gains); ${names[1]} is running ${b.currentDasha?.lord ?? "—"} (${timing[1] ? "supports" : "does not especially support"} them).`
      ),
    ];
  }

  if (type === "friendship") {
    const bonds = overlays(a, b, { planets: ["Moon", "Jupiter", "Venus"], houses: [3, 5, 11] }, names);
    const jm = [contact(planet(a, "Jupiter"), planet(b, "Moon")), contact(planet(b, "Jupiter"), planet(a, "Moon"))].filter(Boolean);
    const friction = pressure(a, b, ["Saturn", "Mars"], ["Moon"], names);
    checkpoints = [
      grahaMaitri(a, b, 20, "Mental rapport — the heart of a friendship"),
      moonRelationship(type, a, b, 20),
      kootaCheckpoint(a, b, "Gana", "Temperament (Gana)", "Whether your natures are easy to be around", 15),
      kootaCheckpoint(a, b, "Tara", "Birth stars (Tara)", "Whether time together tends to go well for both", 10),
      kootaCheckpoint(a, b, "Vashya", "Mutual influence (Vashya)", "Whether influence runs both ways rather than one dominating", 5),
      checkpoint(
        "bonds",
        "Friendship overlays",
        "Placements that make you feel like companions and allies",
        15,
        bonds.length / 3,
        bonds.length ? `${bonds.join("; ")} — the houses of companionship, joy and friendship.` : "No Moon, Jupiter or Venus falls in the other's 3rd, 5th or 11th house."
      ),
      checkpoint(
        "jupiter-moon",
        "Jupiter and Moon contact",
        "Whether one naturally encourages and uplifts the other",
        10,
        jm.length ? Math.max(...jm.map((c) => c!.strength)) : 0.2,
        jm.length ? "One person's Jupiter contacts the other's Moon — a supportive, generous bond." : "No direct Jupiter–Moon contact between the charts."
      ),
      checkpoint(
        "friction",
        "Friction points",
        "Where one person's Saturn or Mars weighs on the other's feelings",
        5,
        friction.length === 0 ? 1 : friction.length === 1 ? 0.5 : 0,
        friction.length ? `${friction.join("; ")}.` : "No Saturn or Mars sits on the other's Moon."
      ),
    ];
  }

  if (type === "romance") {
    const vm = [
      { c: contact(planet(a, "Venus"), planet(b, "Mars")), who: `${names[0]}'s Venus and ${names[1]}'s Mars` },
      { c: contact(planet(b, "Venus"), planet(a, "Mars")), who: `${names[1]}'s Venus and ${names[0]}'s Mars` },
    ].filter((x) => x.c);
    const mv = [contact(planet(a, "Moon"), planet(b, "Venus")), contact(planet(b, "Moon"), planet(a, "Venus"))].filter(Boolean);
    const romance = overlays(a, b, { planets: ["Venus", "Moon", "Mars"], houses: [5, 7] }, names);
    const cooling = pressure(a, b, ["Saturn", "Rahu"], ["Venus", "Moon"], names);
    const ma = a.mangalDosha.status === "present";
    const mb = b.mangalDosha.status === "present";
    checkpoints = [
      checkpoint(
        "attraction",
        "Venus and Mars",
        "Chemistry and physical attraction",
        15,
        vm.length ? Math.min(1, vm.reduce((s, x) => s + x.c!.strength, 0) / 1.3) : 0.2,
        vm.length ? `${vm.map((x) => `${x.who} are ${x.c!.kind}`).join("; ")}.` : "Neither person's Venus contacts the other's Mars by sign."
      ),
      moonRelationship(type, a, b, 15),
      grahaMaitri(a, b, 12, "Whether you understand how the other thinks and feels"),
      kootaCheckpoint(a, b, "Yoni", "Intimacy (Yoni)", "Physical and intimate compatibility", 12),
      kootaCheckpoint(a, b, "Gana", "Temperament (Gana)", "Whether your natures fit day to day", 10),
      checkpoint(
        "affection",
        "Moon and Venus",
        "Tenderness and feeling cared for",
        8,
        mv.length ? Math.max(...mv.map((c) => c!.strength)) : 0.2,
        mv.length ? "One person's Moon contacts the other's Venus — affection comes easily." : "No direct Moon–Venus contact between the charts."
      ),
      checkpoint(
        "romance-houses",
        "Romance overlays",
        "Placements that light up each other's houses of romance and partnership",
        13,
        romance.length / 3,
        romance.length ? `${romance.join("; ")} — the 5th house of romance and the 7th of partnership.` : "No Venus, Moon or Mars falls in the other's 5th or 7th house."
      ),
      checkpoint(
        "mangal",
        "Mangal Dosha balance",
        "Whether Mars energy is evenly matched",
        5,
        ma === mb ? 1 : 0.3,
        ma === mb ? (ma ? "Both charts carry Mangal Dosha, which traditionally balances out." : "Neither chart carries an uncancelled Mangal Dosha.") : `Only ${ma ? names[0] : names[1]}'s chart carries an uncancelled Mangal Dosha.`
      ),
      checkpoint(
        "cooling",
        "Cooling or obsessive contacts",
        "Saturn can cool feelings; Rahu can make them intense or unsettled",
        10,
        cooling.length === 0 ? 1 : cooling.length === 1 ? 0.5 : 0,
        cooling.length ? `${cooling.join("; ")}.` : "No Saturn or Rahu sits on the other's Venus or Moon."
      ),
    ];
  }

  const score = Math.round(checkpoints.reduce((s, c) => s + c.points, 0));
  const label = score >= 75 ? "Excellent" : score >= 60 ? "Good" : score >= 45 ? "Workable" : "Challenging";
  const noun = type === "business" ? "business partnership" : type === "friendship" ? "friendship" : "romantic match";
  const summary =
    label === "Excellent"
      ? `An excellent ${noun} by these measures — the charts support each other on most counts.`
      : label === "Good"
        ? `A good ${noun}: real strengths, with a few areas to handle consciously.`
        : label === "Workable"
          ? `A workable ${noun}. The strengths are there, but so are points that need awareness and effort.`
          : `A challenging ${noun} by these measures — worth going in with open eyes and clear agreements.`;

  return {
    type,
    score,
    label,
    summary,
    checkpoints,
    strengths: checkpoints.filter((c) => c.verdict === "Strong").map((c) => c.title),
    cautions: checkpoints.filter((c) => c.verdict === "Caution" || c.verdict === "Challenging").map((c) => c.title),
  };
}

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  romance: "Romantic interest",
  business: "Business partner",
  friendship: "Friendship",
};

