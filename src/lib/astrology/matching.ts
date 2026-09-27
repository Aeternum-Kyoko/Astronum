import { NAKSHATRAS, SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { computeAvakahada, type Avakahada } from "./birthDetails";
import { FRIENDS, ENEMIES } from "./dignity";
import type { MangalDoshaResult } from "./mangalDosha";
import type { PlanetPlacement } from "./types";
import type { CompatibilityResult, RelationshipType } from "./compatibility";

/**
 * Ashtakoota Guna Milan — the classical 36-point marriage compatibility score,
 * computed from each partner's natal Moon (sign and nakshatra). Tables follow
 * the North Indian convention used by mainstream kundli-matching software.
 */

export type MoonInput = Pick<PlanetPlacement, "signIndex" | "degreeInSign" | "nakshatraIndex" | "pada">;

export interface KootaScore {
  name: string;
  /** What this koota is traditionally read to measure. */
  area: string;
  boy: string;
  girl: string;
  score: number;
  max: number;
  note?: string;
}

export interface MatchResult {
  kootas: KootaScore[];
  total: number;
  max: 36;
  verdict: "Not recommended" | "Average" | "Good" | "Excellent";
}

const VARNA_RANK: Record<string, number> = { Shudra: 1, Vaishya: 2, Kshatriya: 3, Brahmin: 4 };

const VASHYA_ORDER = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"];
// Rows: boy's vashya, columns: girl's vashya (VASHYA_ORDER).
const VASHYA_TABLE = [
  [2, 1, 1, 0.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0.5, 0, 1, 2, 0],
  [1, 1, 1, 0, 2],
];

export const YONI_ORDER = [
  "Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat",
  "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion",
];
// Symmetric; 0 marks the seven sworn-enemy pairs (Horse–Buffalo, Elephant–Lion,
// Sheep–Monkey, Serpent–Mongoose, Dog–Deer, Cat–Rat, Cow–Tiger).
export const YONI_TABLE = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
];

const GANA_ORDER = ["Deva", "Manushya", "Rakshasa"];
// Rows: boy's gana, columns: girl's gana.
const GANA_TABLE = [
  [6, 6, 1],
  [5, 6, 0],
  [1, 0, 6],
];

const TARA_NAMES = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati-Mitra"];
const INAUSPICIOUS_TARAS = new Set([3, 5, 7]); // Vipat, Pratyari, Vadha

type Relation = "Friend" | "Neutral" | "Enemy";

export function naturalRelation(from: PlanetName, to: PlanetName): Relation {
  if (from === to || FRIENDS[from]?.includes(to)) return "Friend";
  if (ENEMIES[from]?.includes(to)) return "Enemy";
  return "Neutral";
}

export function grahaMaitriScore(a: PlanetName, b: PlanetName): number {
  if (a === b) return 5;
  const pair = [naturalRelation(a, b), naturalRelation(b, a)].sort().join("-");
  switch (pair) {
    case "Friend-Friend":
      return 5;
    case "Friend-Neutral":
      return 4;
    case "Neutral-Neutral":
      return 3;
    case "Enemy-Friend":
      return 1;
    case "Enemy-Neutral":
      return 0.5;
    default:
      return 0; // Enemy-Enemy
  }
}

/** Inclusive count from one nakshatra/sign to another, e.g. the same one is 1. */
function countFrom(from: number, to: number, cycle: number): number {
  return ((to - from + cycle) % cycle) + 1;
}

function taraFromCount(count: number): number {
  return ((count - 1) % 9) + 1; // 1–9
}

export function computeGunaMilan(boyMoon: MoonInput, girlMoon: MoonInput): MatchResult {
  const boy = computeAvakahada(boyMoon);
  const girl = computeAvakahada(girlMoon);

  const kootas: KootaScore[] = [
    varnaKoota(boy, girl),
    {
      name: "Vashya",
      area: "Mutual attraction and influence",
      boy: boy.vashya,
      girl: girl.vashya,
      score: VASHYA_TABLE[VASHYA_ORDER.indexOf(boy.vashya)][VASHYA_ORDER.indexOf(girl.vashya)],
      max: 2,
    },
    taraKoota(boyMoon, girlMoon),
    yoniKoota(boy, girl),
    grahaMaitriKoota(boy, girl, boyMoon, girlMoon),
    {
      name: "Gana",
      area: "Temperament",
      boy: boy.gana,
      girl: girl.gana,
      score: GANA_TABLE[GANA_ORDER.indexOf(boy.gana)][GANA_ORDER.indexOf(girl.gana)],
      max: 6,
    },
    bhakootKoota(boyMoon, girlMoon),
    nadiKoota(boy, girl, boyMoon, girlMoon),
  ];

  const total = kootas.reduce((sum, k) => sum + k.score, 0);
  const verdict = total < 18 ? "Not recommended" : total <= 24 ? "Average" : total <= 32 ? "Good" : "Excellent";
  return { kootas, total, max: 36, verdict };
}

function varnaKoota(boy: Avakahada, girl: Avakahada): KootaScore {
  return {
    name: "Varna",
    area: "Spiritual compatibility and ego",
    boy: boy.varna,
    girl: girl.varna,
    score: VARNA_RANK[boy.varna] >= VARNA_RANK[girl.varna] ? 1 : 0,
    max: 1,
  };
}

function taraKoota(boyMoon: MoonInput, girlMoon: MoonInput): KootaScore {
  const girlToBoy = taraFromCount(countFrom(girlMoon.nakshatraIndex, boyMoon.nakshatraIndex, 27));
  const boyToGirl = taraFromCount(countFrom(boyMoon.nakshatraIndex, girlMoon.nakshatraIndex, 27));
  const score = (INAUSPICIOUS_TARAS.has(girlToBoy) ? 0 : 1.5) + (INAUSPICIOUS_TARAS.has(boyToGirl) ? 0 : 1.5);
  return {
    name: "Tara",
    area: "Health and well-being of the couple",
    boy: NAKSHATRAS[boyMoon.nakshatraIndex],
    girl: NAKSHATRAS[girlMoon.nakshatraIndex],
    score,
    max: 3,
    note: `Counted from the girl's nakshatra the boy's is ${TARA_NAMES[girlToBoy - 1]} tara; from the boy's, the girl's is ${TARA_NAMES[boyToGirl - 1]}.`,
  };
}

function yoniKoota(boy: Avakahada, girl: Avakahada): KootaScore {
  const score = YONI_TABLE[YONI_ORDER.indexOf(boy.yoni)][YONI_ORDER.indexOf(girl.yoni)];
  return {
    name: "Yoni",
    area: "Physical and intimate compatibility",
    boy: boy.yoni,
    girl: girl.yoni,
    score,
    max: 4,
    note: score === 0 ? "These yonis are classical enemies (Yoni Dosha)." : undefined,
  };
}

function grahaMaitriKoota(boy: Avakahada, girl: Avakahada, boyMoon: MoonInput, girlMoon: MoonInput): KootaScore {
  return {
    name: "Graha Maitri",
    area: "Mental compatibility and friendship",
    boy: `${SIGN_LORDS[boyMoon.signIndex]} (${SIGNS[boyMoon.signIndex]})`,
    girl: `${SIGN_LORDS[girlMoon.signIndex]} (${SIGNS[girlMoon.signIndex]})`,
    score: grahaMaitriScore(boy.signLord, girl.signLord),
    max: 5,
  };
}

function bhakootKoota(boyMoon: MoonInput, girlMoon: MoonInput): KootaScore {
  const a = countFrom(girlMoon.signIndex, boyMoon.signIndex, 12);
  const b = countFrom(boyMoon.signIndex, girlMoon.signIndex, 12);
  const pair = [a, b].sort((x, y) => x - y).join("/");
  // 2/12, 5/9 and 6/8 placements are Bhakoot Dosha; everything else scores full.
  const dosha = ["2/12", "5/9", "6/8"].includes(pair);
  const boyLord = SIGN_LORDS[boyMoon.signIndex];
  const girlLord = SIGN_LORDS[girlMoon.signIndex];
  const cancelled =
    dosha && (boyLord === girlLord || (naturalRelation(boyLord, girlLord) === "Friend" && naturalRelation(girlLord, boyLord) === "Friend"));
  return {
    name: "Bhakoot",
    area: "Family welfare, finances and prosperity",
    boy: SIGNS[boyMoon.signIndex],
    girl: SIGNS[girlMoon.signIndex],
    score: dosha ? 0 : 7,
    max: 7,
    note: dosha
      ? `The Moon signs are ${pair.replace("/", "–")} from each other (Bhakoot Dosha).${
          cancelled ? " Their lords are the same or mutual friends, which is classically held to cancel it." : ""
        }`
      : undefined,
  };
}

function nadiKoota(boy: Avakahada, girl: Avakahada, boyMoon: MoonInput, girlMoon: MoonInput): KootaScore {
  const dosha = boy.nadi === girl.nadi;
  let exception: string | undefined;
  if (dosha) {
    if (boyMoon.nakshatraIndex === girlMoon.nakshatraIndex && boyMoon.pada !== girlMoon.pada) {
      exception = "Both share a nakshatra but in different padas, which is classically held to cancel it.";
    } else if (boyMoon.signIndex === girlMoon.signIndex && boyMoon.nakshatraIndex !== girlMoon.nakshatraIndex) {
      exception = "Both Moons share a sign but sit in different nakshatras, which is classically held to cancel it.";
    }
  }
  return {
    name: "Nadi",
    area: "Health, genes and progeny",
    boy: boy.nadi,
    girl: girl.nadi,
    score: dosha ? 0 : 8,
    max: 8,
    note: dosha ? `Both have ${boy.nadi} nadi (Nadi Dosha).${exception ? ` ${exception}` : ""}` : undefined,
  };
}

export interface ManglikComparison {
  boy: MangalDoshaResult["status"];
  girl: MangalDoshaResult["status"];
  compatible: boolean;
  summary: string;
}

export function compareManglik(boy: MangalDoshaResult, girl: MangalDoshaResult): ManglikComparison {
  const boyManglik = boy.status === "present";
  const girlManglik = girl.status === "present";
  let summary: string;
  if (boyManglik && girlManglik) {
    summary = "Both charts carry Mangal Dosha. Traditionally the two doshas balance each other, so this is considered a compatible pairing.";
  } else if (boyManglik || girlManglik) {
    summary = `Only the ${boyManglik ? "boy's" : "girl's"} chart carries an uncancelled Mangal Dosha. Traditionally this calls for careful consideration or remedies.`;
  } else {
    summary = "Neither chart carries an uncancelled Mangal Dosha, so there is no Manglik concern.";
  }
  return { boy: boy.status, girl: girl.status, compatible: boyManglik === girlManglik, summary };
}

export interface MatchPartner {
  name: string;
  date: string;
  time: string;
  place: string;
  ascendant: string;
  moonSign: string;
  nakshatra: string;
  pada: number;
  mangalDosha: MangalDoshaResult;
}

/** What /api/matching returns. */
export interface MatchResponse {
  boy: MatchPartner;
  girl: MatchPartner;
  match: MatchResult;
  manglik: ManglikComparison;
}

/** What /api/matching returns for romance, business and friendship. */
export interface CompatibilityResponse {
  type: RelationshipType;
  a: MatchPartner;
  b: MatchPartner;
  compatibility: CompatibilityResult;
}
