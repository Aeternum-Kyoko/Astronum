import { describe, it, expect } from "vitest";
import { analyzeVargaPlanetStrength } from "../vargaPlanetStrength";
import { PLANETS, type PlanetName } from "../constants";

function fixture(overrides: Partial<Record<PlanetName, number>>): { planet: PlanetName; signIndex: number }[] {
  return PLANETS.map((planet) => ({ planet, signIndex: overrides[planet] ?? 11 }));
}

describe("analyzeVargaPlanetStrength", () => {
  it("returns one entry per input planet, each scored 0-100 with a matching verdict", () => {
    const entries = analyzeVargaPlanetStrength(0, fixture({}));
    expect(entries).toHaveLength(PLANETS.length);
    for (const e of entries) {
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(100);
      if (e.score >= 65) expect(e.verdict).toBe("Strong");
      else if (e.score >= 40) expect(e.verdict).toBe("Balanced");
      else expect(e.verdict).toBe("Weak");
    }
  });

  it("scores an exalted planet higher than the same planet debilitated, holding house type equal", () => {
    // Aries rising; both placements land in a kendra house, isolating the dignity difference.
    const strong = analyzeVargaPlanetStrength(0, fixture({ Jupiter: 3 })); // Cancer, exalted, house 4 (kendra)
    const weak = analyzeVargaPlanetStrength(0, fixture({ Jupiter: 9 })); // Capricorn, debilitated, house 10 (kendra)
    const strongEntry = strong.find((e) => e.planet === "Jupiter")!;
    const weakEntry = weak.find((e) => e.planet === "Jupiter")!;
    expect(strongEntry.score).toBeGreaterThan(weakEntry.score);
  });

  it("scores a trikona placement higher than a dushthana placement, all else equal", () => {
    const trikona = analyzeVargaPlanetStrength(0, fixture({ Venus: 4 })); // Leo, house 5 (trikona)
    const dushthana = analyzeVargaPlanetStrength(0, fixture({ Venus: 5 })); // Virgo, house 6 (dushthana)
    const trikonaEntry = trikona.find((e) => e.planet === "Venus")!;
    const dushthanaEntry = dushthana.find((e) => e.planet === "Venus")!;
    expect(trikonaEntry.score).toBeGreaterThan(dushthanaEntry.score);
  });

  it("reports the correct house for each planet relative to the ascendant", () => {
    const entries = analyzeVargaPlanetStrength(0, fixture({ Mars: 9 })); // Capricorn, house 10 from Aries rising
    expect(entries.find((e) => e.planet === "Mars")!.house).toBe(10);
  });

  it("gives Rahu/Ketu a flat, documented-as-not-assessed dignity note rather than a real dignity verdict", () => {
    const entries = analyzeVargaPlanetStrength(0, fixture({}));
    const rahu = entries.find((e) => e.planet === "Rahu")!;
    expect(rahu.rationale).toMatch(/not assessed for the lunar nodes/i);
  });

  it("notes benefic and malefic aspects received in the rationale", () => {
    // Aries rising; Jupiter at 0 (house 1), Saturn at 6 (Libra, house 7 — aspects Jupiter's 7th).
    const entries = analyzeVargaPlanetStrength(0, fixture({ Jupiter: 0, Saturn: 6 }));
    const jupiter = entries.find((e) => e.planet === "Jupiter")!;
    expect(jupiter.rationale).toContain("Saturn (malefic)");
  });
});
