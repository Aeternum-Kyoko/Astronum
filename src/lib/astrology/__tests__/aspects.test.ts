import { describe, it, expect } from "vitest";
import { aspectsSign, computeAspects, getAspectedHouses } from "../aspects";

describe("getAspectedHouses / aspectsSign", () => {
  it("gives every ordinary planet only the universal 7th aspect", () => {
    expect(getAspectedHouses("Sun")).toEqual([7]);
    expect(getAspectedHouses("Venus")).toEqual([7]);
    expect(getAspectedHouses("Rahu")).toEqual([7]);
    expect(getAspectedHouses("Ketu")).toEqual([7]);
  });

  it("gives Mars its 4th, 7th, and 8th special aspects", () => {
    expect(getAspectedHouses("Mars").sort()).toEqual([4, 7, 8]);
  });

  it("gives Jupiter its 5th, 7th, and 9th special aspects", () => {
    expect(getAspectedHouses("Jupiter").sort()).toEqual([5, 7, 9]);
  });

  it("gives Saturn its 3rd, 7th, and 10th special aspects — always aspects +3/+10/+7 from itself", () => {
    expect(getAspectedHouses("Saturn").sort((a, b) => a - b)).toEqual([3, 7, 10]);
    expect(aspectsSign("Saturn", 3)).toBe(true);
    expect(aspectsSign("Saturn", 7)).toBe(true);
    expect(aspectsSign("Saturn", 10)).toBe(true);
    expect(aspectsSign("Saturn", 5)).toBe(false);
  });
});

describe("computeAspects", () => {
  it("finds no aspects when two planets sit two signs apart, not a 7th/special distance", () => {
    const edges = computeAspects([
      { planet: "Sun", signIndex: 0 },
      { planet: "Moon", signIndex: 2 },
    ]);
    expect(edges).toHaveLength(0);
  });

  it("finds a mutual 7th-house aspect between two planets exactly opposite each other", () => {
    const edges = computeAspects([
      { planet: "Sun", signIndex: 0 },
      { planet: "Saturn", signIndex: 6 }, // Aries vs Libra, opposite
    ]);
    expect(edges.some((e) => e.from === "Sun" && e.to === "Saturn")).toBe(true);
    expect(edges.some((e) => e.from === "Saturn" && e.to === "Sun")).toBe(true);
  });

  it("marks aspects from benefics as benefic and from malefics as malefic", () => {
    const edges = computeAspects([
      { planet: "Jupiter", signIndex: 0 },
      { planet: "Sun", signIndex: 6 },
      { planet: "Mars", signIndex: 6 },
    ]);
    const fromJupiter = edges.find((e) => e.from === "Jupiter" && e.to === "Sun")!;
    const fromMars = edges.find((e) => e.from === "Mars" && e.to === "Jupiter")!;
    expect(fromJupiter.benefic).toBe(true);
    expect(fromMars.benefic).toBe(false);
  });

  it("gives Mars its special 4th/8th aspects in addition to the 7th", () => {
    const edges = computeAspects([
      { planet: "Mars", signIndex: 0 },
      { planet: "Sun", signIndex: 3 }, // 4th from Aries
      { planet: "Moon", signIndex: 7 }, // 8th from Aries
    ]);
    expect(edges.some((e) => e.from === "Mars" && e.to === "Sun" && e.houseDistance === 4)).toBe(true);
    expect(edges.some((e) => e.from === "Mars" && e.to === "Moon" && e.houseDistance === 8)).toBe(true);
  });
});
