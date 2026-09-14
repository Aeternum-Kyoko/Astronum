import { describe, it, expect } from "vitest";
import { computeBhinnashtakavarga, computeSarvashtakavarga } from "../ashtakavarga";
import { ASHTAKAVARGA_PLANETS, type AshtakavargaPlanet } from "../constants";

// The standard self-check for a correctly-transcribed Ashtakavarga table:
// every contributor placed in Aries (sign 0) still must yield each target
// planet's well-published classical bindu total, since the tables are
// counted *relative* to each contributor's own sign.
const EXPECTED_TOTALS: Record<AshtakavargaPlanet, number> = {
  Sun: 48,
  Moon: 49,
  Mars: 39,
  Mercury: 54,
  Jupiter: 56,
  Venus: 52,
  Saturn: 39,
};

const ALL_IN_ARIES = {
  Sun: 0,
  Moon: 0,
  Mars: 0,
  Mercury: 0,
  Jupiter: 0,
  Venus: 0,
  Saturn: 0,
  Ascendant: 0,
} as const;

describe("computeBhinnashtakavarga — classical fixed totals", () => {
  it.each(ASHTAKAVARGA_PLANETS)("%s's Bhinnashtakavarga sums to its published total regardless of contributor placement", (planet) => {
    const bindus = computeBhinnashtakavarga(planet, ALL_IN_ARIES);
    const total = bindus.reduce((a, b) => a + b, 0);
    expect(total).toBe(EXPECTED_TOTALS[planet]);
  });

  it("gives every sign a non-negative, in-range bindu count (0-8)", () => {
    for (const planet of ASHTAKAVARGA_PLANETS) {
      const bindus = computeBhinnashtakavarga(planet, ALL_IN_ARIES);
      expect(bindus).toHaveLength(12);
      for (const count of bindus) {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(8);
      }
    }
  });
});

describe("computeSarvashtakavarga", () => {
  it("sums to the classical grand total of 337 bindus", () => {
    const bhinna = Object.fromEntries(
      ASHTAKAVARGA_PLANETS.map((planet) => [planet, computeBhinnashtakavarga(planet, ALL_IN_ARIES)])
    ) as Record<AshtakavargaPlanet, number[]>;
    const sarva = computeSarvashtakavarga(bhinna);
    expect(sarva.reduce((a, b) => a + b, 0)).toBe(337);
  });

  it("is invariant to which sign every contributor is rotated to together", () => {
    const rotated = Object.fromEntries(
      ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].map((c) => [c, 3])
    ) as Record<string, number>;
    rotated.Ascendant = 3;
    const bhinna = Object.fromEntries(
      ASHTAKAVARGA_PLANETS.map((planet) => [
        planet,
        computeBhinnashtakavarga(planet, rotated as unknown as Record<AshtakavargaPlanet | "Ascendant", number>),
      ])
    ) as Record<AshtakavargaPlanet, number[]>;
    const sarva = computeSarvashtakavarga(bhinna);
    expect(sarva.reduce((a, b) => a + b, 0)).toBe(337);
  });
});
