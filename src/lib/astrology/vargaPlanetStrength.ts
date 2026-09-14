import { computeAspects } from "./aspects";
import { ASHTAKAVARGA_PLANETS, type AshtakavargaPlanet, type PlanetName } from "./constants";
import { signOffsetHouse } from "./math";
import { vargaDignityPoints } from "./panchadhaMaitri";

export type StrengthVerdict = "Strong" | "Balanced" | "Weak";

export interface PlanetStrengthEntry {
  planet: PlanetName;
  house: number;
  score: number; // 0-100, a heuristic composed from dignity, house placement, and aspects — not a classical Shadbala rupas figure
  verdict: StrengthVerdict;
  rationale: string;
}

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([1, 5, 9]);
const DUSHTHANA_HOUSES = new Set([6, 8, 12]);

/** Classical exaltation/own-sign/friendship dignity isn't assessed for Rahu/Ketu in this app (see `dignity.ts`'s `getDignity`), so the nodes get a flat, "not assessed" mid-scale dignity contribution instead of a real one. */
const NODE_DIGNITY_SCORE = 20; // out of 60 — roughly a Panchadha Maitri "Friend" (15/45 * 60 = 20)

function isAshtakavargaPlanet(planet: PlanetName): planet is AshtakavargaPlanet {
  return (ASHTAKAVARGA_PLANETS as readonly string[]).includes(planet);
}

/**
 * A planet's condition *within one specific chart* — documented approximation,
 * not a classical strength system. Combines: dignity in this varga (via the
 * shared `vargaDignityPoints`), the classical quality of the house it occupies
 * (kendra/trikona/dushthana), and net graha-drishti received.
 */
export function analyzeVargaPlanetStrength(
  ascendantSignIndex: number,
  planets: { planet: PlanetName; signIndex: number }[]
): PlanetStrengthEntry[] {
  const signIndices = Object.fromEntries(
    planets.filter((p) => isAshtakavargaPlanet(p.planet)).map((p) => [p.planet, p.signIndex])
  ) as Record<AshtakavargaPlanet, number>;

  const aspects = computeAspects(planets);

  return planets.map((p) => {
    const house = signOffsetHouse(p.signIndex, ascendantSignIndex);

    const dignityScore = isAshtakavargaPlanet(p.planet)
      ? (vargaDignityPoints(p.planet, p.signIndex, signIndices) / 45) * 60
      : NODE_DIGNITY_SCORE;

    let placementScore: number;
    let placementNote: string;
    if (house === 1) {
      placementScore = 40;
      placementNote = "anchors the 1st house, a kendra and trikona at once";
    } else if (TRIKONA_HOUSES.has(house)) {
      placementScore = 35;
      placementNote = `occupies house ${house}, an auspicious trikona`;
    } else if (KENDRA_HOUSES.has(house)) {
      placementScore = 30;
      placementNote = `holds house ${house}, a pillar (kendra) house`;
    } else if (DUSHTHANA_HOUSES.has(house)) {
      placementScore = 5;
      placementNote = `is placed in house ${house}, a difficult (dushthana) house`;
    } else {
      placementScore = 20;
      placementNote = `sits in house ${house}, a workable, ordinary house`;
    }

    const received = aspects.filter((a) => a.to === p.planet);
    const cast = aspects.filter((a) => a.from === p.planet);
    const aspectScore = Math.max(
      -20,
      Math.min(20, received.reduce((sum, a) => sum + (a.benefic ? 5 : -5), 0))
    );

    const score = Math.max(0, Math.min(100, Math.round(dignityScore + placementScore + aspectScore)));
    const verdict: StrengthVerdict = score >= 65 ? "Strong" : score >= 40 ? "Balanced" : "Weak";

    const aspectClauses: string[] = [];
    if (received.length > 0) {
      aspectClauses.push(
        `receives aspect${received.length > 1 ? "s" : ""} from ${received
          .map((a) => `${a.from} (${a.benefic ? "benefic" : "malefic"})`)
          .join(", ")}`
      );
    }
    if (cast.length > 0) {
      aspectClauses.push(`casts its own aspect toward ${cast.map((a) => a.to).join(", ")}`);
    }
    const nodeNote = !isAshtakavargaPlanet(p.planet)
      ? " Classical exaltation/own-sign dignity is not assessed for the lunar nodes here, so this reflects placement and aspect alone."
      : "";

    const rationale = `${p.planet} ${placementNote}${
      aspectClauses.length > 0 ? `, and ${aspectClauses.join("; ")}` : ""
    }.${nodeNote}`;

    return { planet: p.planet, house, score, verdict, rationale };
  });
}
