import { describe, it, expect } from "vitest";
import { analyzeHouses, findConjunctions, type AnalyzablePlanet } from "../houseAnalysis";
import { PLANETS, type PlanetName } from "../constants";

/** Every unlisted planet parks in Pisces (11) — a sign none of the tests below assert anything about. */
function fixture(overrides: Partial<Record<PlanetName, number>>): AnalyzablePlanet[] {
  return PLANETS.map((planet) => ({ planet, signIndex: overrides[planet] ?? 11 }));
}

describe("analyzeHouses", () => {
  it("produces exactly 12 houses starting from the Ascendant's own sign", () => {
    const houses = analyzeHouses(3, fixture({})); // Cancer rising
    expect(houses).toHaveLength(12);
    expect(houses[0].sign).toBe("Cancer");
    expect(houses[0].house).toBe(1);
    expect(houses[11].sign).toBe("Gemini");
  });

  it("assigns the correct classical lord per house", () => {
    const houses = analyzeHouses(0, fixture({})); // Aries rising
    expect(houses[0].lord).toBe("Mars");
    expect(houses[3].lord).toBe("Moon"); // Cancer, house 4
  });

  it("lists every planet actually occupying a house as an occupant", () => {
    const houses = analyzeHouses(0, fixture({ Mars: 10 })); // Mars in Aquarius, house 11
    expect(houses[10].occupants.map((o) => o.planet)).toEqual(["Mars"]);
    expect(houses[0].occupants).toHaveLength(0); // Aries itself stays empty
  });

  it("finds where each house's lord sits and reports that house number", () => {
    const houses = analyzeHouses(0, fixture({ Mars: 9 })); // Aries rising; Mars (lord of house 1) in Capricorn, house 10
    expect(houses[0].lordHouse).toBe(10);
    expect(houses[0].lordSign).toBe("Capricorn");
  });

  it("includes a narrative string mentioning the occupying planet when present", () => {
    const houses = analyzeHouses(0, fixture({ Jupiter: 9 })); // Jupiter in Capricorn, house 10
    expect(houses[9].narrative).toContain("Jupiter");
  });

  it("notes the absence of occupants when a house is empty", () => {
    const houses = analyzeHouses(0, fixture({})); // everything parked in Pisces
    expect(houses[0].occupants).toHaveLength(0); // Aries, house 1
    expect(houses[0].narrative).toMatch(/no planet occupies this house/i);
  });
});

describe("findConjunctions", () => {
  it("finds no conjunctions when every planet sits in a different sign", () => {
    const conjunctions = findConjunctions(
      0,
      PLANETS.map((planet, i) => ({ planet, signIndex: i }))
    );
    expect(conjunctions).toHaveLength(0);
  });

  it("groups two planets sharing a sign into one conjunction", () => {
    const conjunctions = findConjunctions(0, fixture({ Sun: 2, Mercury: 2 })); // both in Gemini, rest parked in Pisces
    const gemini = conjunctions.find((c) => c.sign === "Gemini")!;
    expect(gemini.planets.sort()).toEqual(["Mercury", "Sun"]);
  });

  it("computes the conjunction's house relative to the Ascendant", () => {
    const conjunctions = findConjunctions(0, fixture({ Sun: 6, Mercury: 6 })); // Libra, house 7 from Aries rising
    const libra = conjunctions.find((c) => c.sign === "Libra")!;
    expect(libra.house).toBe(7);
  });

  it("groups three or more planets in the same sign into a single conjunction", () => {
    const conjunctions = findConjunctions(0, fixture({ Sun: 9, Venus: 9, Saturn: 9 })); // Capricorn
    const capricorn = conjunctions.find((c) => c.sign === "Capricorn")!;
    expect(capricorn.planets).toHaveLength(3);
  });

  it("sorts conjunctions by house number", () => {
    const conjunctions = findConjunctions(0, fixture({ Sun: 8, Moon: 8, Mars: 2, Mercury: 2 }));
    const houses = conjunctions.map((c) => c.house);
    expect(houses).toEqual([...houses].sort((a, b) => a - b));
  });
});
