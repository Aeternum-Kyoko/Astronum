import { describe, it, expect } from "vitest";
import { analyzeBhavaStrength } from "../bhavaStrength";
import { PLANETS, type PlanetName } from "../constants";
import type { ShadbalaResult } from "../types";

/** Every unlisted planet parks in Pisces (11) — mirrors the fixture style in houseAnalysis.test.ts. */
function fixture(overrides: Partial<Record<PlanetName, number>>): { planet: PlanetName; signIndex: number }[] {
  return PLANETS.map((planet) => ({ planet, signIndex: overrides[planet] ?? 11 }));
}

describe("analyzeBhavaStrength", () => {
  it("returns exactly 12 houses, each scored 0-100 with a matching verdict", () => {
    const houses = analyzeBhavaStrength(0, fixture({}));
    expect(houses).toHaveLength(12);
    for (const h of houses) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(100);
      if (h.score >= 65) expect(h.verdict).toBe("Strong");
      else if (h.score >= 40) expect(h.verdict).toBe("Balanced");
      else expect(h.verdict).toBe("Weak");
    }
  });

  it("scores a house higher when its lord sits exalted and well-aspected than when debilitated and afflicted", () => {
    // Aries rising (house 1, lord Mars). Case A: Mars exalted in Capricorn (house 10).
    const strong = analyzeBhavaStrength(0, fixture({ Mars: 9 }));
    // Case B: Mars debilitated in Cancer (house 4), a weaker dignity-by-relation score than exalted.
    const weak = analyzeBhavaStrength(0, fixture({ Mars: 3, Saturn: 9 }));
    const houseA = strong.find((h) => h.house === 1)!;
    const houseB = weak.find((h) => h.house === 1)!;
    expect(houseA.score).toBeGreaterThan(houseB.score);
  });

  it("uses real Shadbala rupas for the house lord's condition when supplied", () => {
    const shadbalaStrong: ShadbalaResult[] = [
      { planet: "Mars", sthanaBala: 0, digBala: 0, kaalaBala: 0, chestaBala: 0, naisargikaBala: 0, drikBala: 0, totalVirupas: 0, rupas: 10, requiredRupas: 5, isStrong: true },
    ];
    const shadbalaWeak: ShadbalaResult[] = [
      { planet: "Mars", sthanaBala: 0, digBala: 0, kaalaBala: 0, chestaBala: 0, naisargikaBala: 0, drikBala: 0, totalVirupas: 0, rupas: 1, requiredRupas: 5, isStrong: false },
    ];
    const houses = fixture({});
    const strong = analyzeBhavaStrength(0, houses, shadbalaStrong).find((h) => h.house === 1)!;
    const weak = analyzeBhavaStrength(0, houses, shadbalaWeak).find((h) => h.house === 1)!;
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.rationale).toContain("Mars");
  });

  it("notes an empty house's story is carried by its lord", () => {
    const houses = analyzeBhavaStrength(0, fixture({}));
    expect(houses[0].rationale).toMatch(/no planet occupies it directly/i);
  });
});
