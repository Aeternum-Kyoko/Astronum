import { SIGN_LORDS, type AshtakavargaPlanet } from "./constants";
import { EXALTATION_SIGN, FRIENDS, ENEMIES, OWN_SIGNS } from "./dignity";

export type NaturalRelation = "Friend" | "Enemy" | "Neutral";
export type TemporalRelation = "Friend" | "Enemy";
export type CombinedRelation = "GreatFriend" | "Friend" | "Neutral" | "Enemy" | "GreatEnemy";

function naturalRelation(from: AshtakavargaPlanet, to: AshtakavargaPlanet): NaturalRelation {
  if (from === to) return "Friend";
  if (FRIENDS[from]?.includes(to)) return "Friend";
  if (ENEMIES[from]?.includes(to)) return "Enemy";
  return "Neutral";
}

const TEMPORAL_FRIEND_DISTANCES = new Set([2, 3, 4, 10, 11, 12]);

/**
 * Temporal (Tatkalika) friendship — BPHS rule: a planet 2nd, 3rd, 4th, 10th,
 * 11th, or 12th from another *in this specific chart* is its temporal
 * friend; the remaining distances (1st/conjunct, 5th, 6th, 7th, 8th, 9th)
 * make it a temporal enemy. Conjunction counting as an enemy distance is
 * counterintuitive but is the classical rule, not an oversight.
 */
export function temporalRelation(fromSignIndex: number, toSignIndex: number): TemporalRelation {
  const distance = ((toSignIndex - fromSignIndex + 12) % 12) + 1; // 1..12
  return TEMPORAL_FRIEND_DISTANCES.has(distance) ? "Friend" : "Enemy";
}

const COMBINE: Record<NaturalRelation, Record<TemporalRelation, CombinedRelation>> = {
  Friend: { Friend: "GreatFriend", Enemy: "Neutral" },
  Neutral: { Friend: "Friend", Enemy: "Enemy" },
  Enemy: { Friend: "Neutral", Enemy: "GreatEnemy" },
};

export function combinedRelation(natural: NaturalRelation, temporal: TemporalRelation): CombinedRelation {
  return COMBINE[natural][temporal];
}

/** Panchadha Maitri (5-fold combined friendship) of `from` toward `to`, given where every classical planet sits in this specific chart. */
export function panchadhaMaitri(
  from: AshtakavargaPlanet,
  to: AshtakavargaPlanet,
  signIndices: Record<AshtakavargaPlanet, number>
): CombinedRelation {
  return combinedRelation(naturalRelation(from, to), temporalRelation(signIndices[from], signIndices[to]));
}

/** The combined relationship a planet has with the lord of the sign it occupies — what Saptavargaja Bala's dignity scoring needs. Returns null for a planet sitting in its own sign (handled separately). */
export function relationToSignLord(
  planet: AshtakavargaPlanet,
  signIndex: number,
  signIndices: Record<AshtakavargaPlanet, number>
): CombinedRelation | null {
  const lord = SIGN_LORDS[signIndex] as AshtakavargaPlanet;
  if (lord === planet) return null;
  return panchadhaMaitri(planet, lord, signIndices);
}

const DIGNITY_POINTS: Record<CombinedRelation, number> = {
  GreatFriend: 22.5,
  Friend: 15,
  Neutral: 7.5,
  Enemy: 3.75,
  GreatEnemy: 1.875,
};

/**
 * A planet's dignity in one specific varga, scored 0-45 — the same scale
 * Saptavargaja Bala accumulates across the seven Shadbala vargas. Exaltation
 * and own-sign are fixed top scores; everything else falls back to Panchadha
 * Maitri's five-fold relationship with that sign's lord. Shared by Shadbala
 * (`saptavargajaBala`) and the house/planet-strength heuristics in
 * `bhavaStrength.ts` / `vargaPlanetStrength.ts` so there is one dignity-in-a-varga
 * implementation, not two.
 */
export function vargaDignityPoints(
  planet: AshtakavargaPlanet,
  signIndex: number,
  signIndices: Record<AshtakavargaPlanet, number>
): number {
  if (EXALTATION_SIGN[planet] === signIndex) return 45;
  if (OWN_SIGNS[planet]?.includes(signIndex)) return 30;
  const relation = relationToSignLord(planet, signIndex, signIndices);
  return relation ? DIGNITY_POINTS[relation] : 30;
}
