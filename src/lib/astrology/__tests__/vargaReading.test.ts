import { describe, it, expect } from "vitest";
import { PLANETS, type PlanetName } from "../constants";
import { HOUSE_SIGNIFICATION } from "../content";
import { VARGA_LENS } from "../vargaLens";
import { readHouses, readPlanets, readConjunctions, summarise, type VargaContext } from "../vargaReading";

/** Every planet parked in Pisces unless placed elsewhere. */
function planets(overrides: Partial<Record<PlanetName, number>>) {
  return PLANETS.map((planet) => ({ planet, signIndex: overrides[planet] ?? 11 }));
}
const ctx = (varga: VargaContext["varga"], asc: number, over: Partial<Record<PlanetName, number>>, extra: Partial<VargaContext> = {}): VargaContext => ({
  varga,
  ascendantSignIndex: asc,
  planets: planets(over),
  ...extra,
});
const planet = (c: VargaContext, p: PlanetName) => readPlanets(c).find((r) => r.planet === p)!;

describe("chart-specific readings", () => {
  it("reads a planet through the chart's own subject, not the birth-chart meanings", () => {
    // Cancer rising; Mars in Gemini = 12th house, ruling the 5th and 10th.
    const c = ctx("D10", 3, { Mars: 2 });
    const mars = planet(c, "Mars");
    expect(mars.reading).toMatch(/technical, engineering, police/);
    expect(mars.reading).toContain(VARGA_LENS.D10.houses[12]);
    expect(mars.reading).toContain(VARGA_LENS.D10.houses[10]);
    expect(mars.reading).not.toContain(HOUSE_SIGNIFICATION[12]);
  });

  it("gives the same placement a different reading in a different chart", () => {
    const d9 = planet(ctx("D9", 3, { Mars: 2 }), "Mars").reading;
    const d10 = planet(ctx("D10", 3, { Mars: 2 }), "Mars").reading;
    expect(d9).toMatch(/marriage/);
    expect(d9).not.toEqual(d10);
  });

  it("links a house to where its lord went, in this chart's terms", () => {
    const tenth = readHouses(ctx("D10", 3, { Mars: 2 }))[9];
    expect(tenth.lord).toBe("Mars");
    expect(tenth.lordHouse).toBe(12);
    expect(tenth.reading).toContain(VARGA_LENS.D10.houses[12]);
  });

  it("uses the planet's dignity in the divisional chart", () => {
    expect(planet(ctx("D10", 0, { Mercury: 5 }), "Mercury").dignity).toBe("Exalted");
    expect(planet(ctx("D10", 0, { Mercury: 5 }), "Mercury").reading).toMatch(/exalted/);
    expect(planet(ctx("D10", 0, { Jupiter: 9 }), "Jupiter").dignity).toBe("Debilitated");
  });

  it("applies the upachaya rule: a malefic does better in the 6th than in the 8th", () => {
    // Aries rising; Saturn in Virgo (6th, neutral) vs Scorpio (8th, enemy) — compare against the same dignity level.
    const sixth = planet(ctx("D10", 0, { Saturn: 5 }), "Saturn");
    const eighth = planet(ctx("D10", 0, { Saturn: 7 }), "Saturn");
    expect(sixth.score).toBeGreaterThan(eighth.score);
    expect(sixth.reading).toMatch(/upachaya/);
  });

  it("counts an aspecting planet once even when it hits several occupants", () => {
    // Aries rising; Mars, Saturn, Rahu in Capricorn (10th); Ketu opposite in Cancer.
    const tenth = readHouses(ctx("D1", 0, { Mars: 9, Saturn: 9, Rahu: 9, Ketu: 3 }))[9];
    expect(tenth.aspectedBy.filter((p) => p === "Ketu")).toHaveLength(1);
  });

  it("marks vargottama planets", () => {
    const c = ctx("D9", 0, { Sun: 4 }, { natalSigns: { Sun: 4, Moon: 0 } });
    expect(planet(c, "Sun").vargottama).toBe(true);
    expect(planet(c, "Moon").vargottama).toBe(false);
    expect(summarise(c).points.join(" ")).toMatch(/Vargottama: Sun/);
  });

  it("places the birth chart's relevant house lord in the divisional chart", () => {
    const c = ctx("D10", 3, { Saturn: 5 }, { natalLords: [{ house: 10, lord: "Saturn" }] });
    expect(summarise(c).points.join(" ")).toMatch(/birth chart's 10th lord, Saturn, lands in this chart's 3rd/);
  });

  it("reads the D30 as risk: a strong planet means the misfortune stays contained", () => {
    const c = ctx("D30", 0, { Mars: 0 }); // Mars in Aries, own sign, in the 1st
    const mars = planet(c, "Mars");
    expect(mars.verdict).toBe("Strong");
    expect(mars.reading).toMatch(/risk of accidents/);
    expect(mars.reading).toMatch(/stays contained/);
    expect(summarise(c).headline).toMatch(/resilience/i);
  });

  it("reads the D2 by hora, not house by house", () => {
    const c = ctx("D2", 4, { Sun: 4, Mars: 4, Saturn: 4, Moon: 3, Jupiter: 3, Venus: 3, Mercury: 3, Rahu: 4, Ketu: 4 });
    const s = summarise(c);
    expect(s.verdict).toBe("Strong");
    expect(s.points.join(" ")).toMatch(/Sun's hora/);
    expect(s.headline).toMatch(/9 of 9 planets/);
  });

  it("describes conjunctions in the chart's own terms", () => {
    const [c] = readConjunctions(ctx("D9", 0, { Venus: 6, Saturn: 6, Mars: 1, Sun: 2, Moon: 3, Mercury: 4, Jupiter: 5, Rahu: 7, Ketu: 8 }));
    expect(c.house).toBe(7);
    expect(c.reading).toContain(VARGA_LENS.D9.houses[7]);
    expect(c.reading).toMatch(/love, romance/);
  });
});
