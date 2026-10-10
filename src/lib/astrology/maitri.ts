import { ASHTAKAVARGA_PLANETS, type PlanetName } from "./constants";
import { FRIENDS, ENEMIES } from "./dignity";
import { signOffsetHouse } from "./math";

export const MAITRI_PLANETS = ASHTAKAVARGA_PLANETS;
export type MaitriGrade = "Great friend" | "Friend" | "Neutral" | "Enemy" | "Great enemy";
export interface MaitriRelationship {
  from: PlanetName;
  to: PlanetName;
  distance: number;
  natural: "Friend" | "Neutral" | "Enemy";
  temporary: "Friend" | "Enemy";
  compound: MaitriGrade;
}

/** Directional natural relationships + sign-based temporary relationships.
 * P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, §3.4, Table 8.
 * Rahu/Ketu are excluded because their natural friendship tables vary by school.
 */
export function panchadhaMaitri(placements: readonly { planet: PlanetName; signIndex: number }[]): MaitriRelationship[] {
  const out: MaitriRelationship[] = [];
  for (const from of MAITRI_PLANETS) {
    const a = placements.find((p) => p.planet === from);
    if (!a) continue;
    for (const to of MAITRI_PLANETS) {
      if (from === to) continue;
      const b = placements.find((p) => p.planet === to);
      if (!b) continue;
      const distance = signOffsetHouse(b.signIndex, a.signIndex);
      const natural = FRIENDS[from]?.includes(to) ? "Friend" : ENEMIES[from]?.includes(to) ? "Enemy" : "Neutral";
      const temporary = [2, 3, 4, 10, 11, 12].includes(distance) ? "Friend" : "Enemy";
      const compound: MaitriGrade = natural === "Friend" ? (temporary === "Friend" ? "Great friend" : "Neutral")
        : natural === "Enemy" ? (temporary === "Friend" ? "Neutral" : "Great enemy")
        : temporary === "Friend" ? "Friend" : "Enemy";
      out.push({ from, to, distance, natural, temporary, compound });
    }
  }
  return out;
}
