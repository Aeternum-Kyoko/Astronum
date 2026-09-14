import { SIGN_LORDS, SIGNS, type PlanetName, type SignName } from "./constants";
import { HOUSE_SIGNIFICATION, PLANET_KEYNOTE } from "./content";
import type { Dignity } from "./dignity";
import { signOffsetHouse } from "./math";

export interface AnalyzablePlanet {
  planet: PlanetName;
  signIndex: number;
  dignity?: Dignity | null;
}

export interface HouseOccupant {
  planet: PlanetName;
  dignity?: Dignity | null;
}

export interface HouseAnalysisEntry {
  house: number;
  sign: SignName;
  signIndex: number;
  lord: PlanetName;
  lordHouse: number;
  lordSign: SignName;
  occupants: HouseOccupant[];
  narrative: string;
}

const DIGNITY_PHRASE: Partial<Record<Dignity, string>> = {
  Exalted: "at its strongest here, exalted",
  Moolatrikona: "very comfortable here, in its Moolatrikona",
  "Own Sign": "at home here, in its own sign",
  "Friend's Sign": "reasonably comfortable, in a friend's sign",
  "Enemy's Sign": "under some strain, in an enemy's sign",
  Debilitated: "weakened here, debilitated",
  "Neutral Sign": "neutrally placed",
};

/**
 * A narrative, house-by-house read of a chart (any divisional chart — pass
 * that chart's own ascendant sign index and its own planet sign positions).
 * Combines classical house significations, who rules each house and where
 * that lord actually sits, and who occupies the house directly — the same
 * three ingredients every Parashari house-lord reading starts from. Pass
 * `lens` (see `vargaLens.ts`) to swap the generic house descriptor for a
 * varga-specific one, e.g. D10 house 10 read as career rather than the
 * universal "career, public standing" — omit it for D1, whose generic
 * framing is already correct.
 */
export function analyzeHouses(
  ascendantSignIndex: number,
  planets: AnalyzablePlanet[],
  lens?: Partial<Record<number, string>>
): HouseAnalysisEntry[] {
  const byPlanet = new Map(planets.map((p) => [p.planet, p]));

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (ascendantSignIndex + i) % 12;
    const sign = SIGNS[signIndex] as SignName;
    const lord = SIGN_LORDS[signIndex] as PlanetName;
    const lordPlacement = byPlanet.get(lord);
    const lordHouse = lordPlacement ? signOffsetHouse(lordPlacement.signIndex, ascendantSignIndex) : house;
    const lordSign = lordPlacement ? (SIGNS[lordPlacement.signIndex] as SignName) : sign;

    const occupants: HouseOccupant[] = planets
      .filter((p) => p.signIndex === signIndex)
      .map((p) => ({ planet: p.planet, dignity: p.dignity }));

    const sentences: string[] = [
      `House ${house} falls in ${sign}, the house of ${lens?.[house] ?? HOUSE_SIGNIFICATION[house]}.`,
      `It is ruled by ${lord}, which sits in house ${lordHouse}${lordHouse !== house ? ` (${lordSign})` : ""} — linking this house to the affairs of ${HOUSE_SIGNIFICATION[lordHouse]}.`,
    ];

    if (occupants.length > 0) {
      const occupantText = occupants
        .map((o) => {
          const phrase = o.dignity ? DIGNITY_PHRASE[o.dignity] : undefined;
          return `${o.planet}${phrase ? ` (${phrase})` : ""}`;
        })
        .join(" and ");
      const keynotes = occupants.map((o) => PLANET_KEYNOTE[o.planet]).join("; and ");
      sentences.push(
        `${occupants.length > 1 ? "Together, " : ""}${occupantText} ${occupants.length > 1 ? "sit" : "sits"} directly in this house, bringing ${keynotes} into how this area of life plays out.`
      );
    } else {
      sentences.push(
        "No planet occupies this house directly, so its story is told mainly through its lord's placement and condition."
      );
    }

    return { house, sign, signIndex, lord, lordHouse, lordSign, occupants, narrative: sentences.join(" ") };
  });
}

export interface Conjunction {
  planets: PlanetName[];
  house: number;
  sign: SignName;
  narrative: string;
}

/** Every group of 2+ planets sharing a sign in this chart, with a plain-language read of what they combine. */
export function findConjunctions(ascendantSignIndex: number, planets: AnalyzablePlanet[]): Conjunction[] {
  const bySign = new Map<number, PlanetName[]>();
  for (const p of planets) {
    const list = bySign.get(p.signIndex) ?? [];
    list.push(p.planet);
    bySign.set(p.signIndex, list);
  }

  const conjunctions: Conjunction[] = [];
  for (const [signIndex, group] of bySign) {
    if (group.length < 2) continue;
    const sign = SIGNS[signIndex] as SignName;
    const house = signOffsetHouse(signIndex, ascendantSignIndex);
    const keynotes = group.map((p) => PLANET_KEYNOTE[p]);
    conjunctions.push({
      planets: group,
      house,
      sign,
      narrative: `${group.join(", ")} are conjunct in ${sign} (house ${house} — ${HOUSE_SIGNIFICATION[house]}), blending ${keynotes.join(", ")} into a single combined force in this part of the chart.`,
    });
  }

  return conjunctions.sort((a, b) => a.house - b.house);
}
