import { ASHTAKAVARGA_PLANETS, type AshtakavargaPlanet } from "./constants";
import type { AshtakavargaResult, PlanetPlacement } from "./types";

export { ASHTAKAVARGA_PLANETS };
export type { AshtakavargaPlanet };

type Contributor = AshtakavargaPlanet | "Ascendant";
const CONTRIBUTORS: Contributor[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Ascendant"];

/**
 * Classical Bhinnashtakavarga bindu tables (BPHS) — for each target planet,
 * the houses (counted from each of the 8 contributors' own sign) that
 * contribute a benefic point (bindu). Rahu/Ketu take no part in Ashtakavarga
 * by tradition, neither as target nor contributor.
 *
 * Each target planet's 8 rows sum to its well-published classical total —
 * verified in __tests__/ashtakavarga.test.ts (Sun 48, Moon 49, Mars 39,
 * Mercury 54, Jupiter 56, Venus 52, Saturn 39; grand total 337) — the
 * standard self-check for a correctly-transcribed Ashtakavarga table.
 */
const BAV_TABLES: Record<AshtakavargaPlanet, Record<Contributor, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Ascendant: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Ascendant: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 4, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Ascendant: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Ascendant: [1, 3, 4, 6, 10, 11],
  },
};

export function computeBhinnashtakavarga(
  target: AshtakavargaPlanet,
  contributorSignIndex: Record<Contributor, number>
): number[] {
  const bindus = new Array(12).fill(0);
  const table = BAV_TABLES[target];
  for (const contributor of CONTRIBUTORS) {
    const fromSign = contributorSignIndex[contributor];
    for (const position of table[contributor]) {
      const signIndex = (fromSign + position - 1) % 12;
      bindus[signIndex] += 1;
    }
  }
  return bindus;
}

export function computeSarvashtakavarga(bhinna: Record<AshtakavargaPlanet, number[]>): number[] {
  const sarva = new Array(12).fill(0);
  for (const planet of ASHTAKAVARGA_PLANETS) {
    bhinna[planet].forEach((count, i) => {
      sarva[i] += count;
    });
  }
  return sarva;
}

/** Sarva + Bhinna Ashtakavarga for a natal chart. Raw bindu counts only — Trikona/Ekadhipatya Shodhana (reduction) is not applied. */
export function computeAshtakavarga(ascendantSignIndex: number, planets: PlanetPlacement[]): AshtakavargaResult {
  const byPlanet = new Map(planets.map((p) => [p.planet, p]));
  const contributorSignIndex: Record<Contributor, number> = {
    Sun: byPlanet.get("Sun")!.signIndex,
    Moon: byPlanet.get("Moon")!.signIndex,
    Mars: byPlanet.get("Mars")!.signIndex,
    Mercury: byPlanet.get("Mercury")!.signIndex,
    Jupiter: byPlanet.get("Jupiter")!.signIndex,
    Venus: byPlanet.get("Venus")!.signIndex,
    Saturn: byPlanet.get("Saturn")!.signIndex,
    Ascendant: ascendantSignIndex,
  };

  const bhinna = {} as Record<AshtakavargaPlanet, number[]>;
  for (const planet of ASHTAKAVARGA_PLANETS) {
    bhinna[planet] = computeBhinnashtakavarga(planet, contributorSignIndex);
  }

  return { bhinna, sarva: computeSarvashtakavarga(bhinna) };
}
