import { describe, it, expect } from "vitest";
import { computeHouseLords } from "../houseLords";
import type { PlanetPlacement } from "../types";
import { PLANETS, SIGNS, type PlanetName } from "../constants";

function fixture(overrides: Partial<Record<PlanetName, { house: number; signIndex: number }>>): PlanetPlacement[] {
  return PLANETS.map((planet) => {
    const o = overrides[planet] ?? { house: 1, signIndex: 0 };
    return {
      planet,
      siderealLongitude: o.signIndex * 30,
      sign: SIGNS[o.signIndex],
      signIndex: o.signIndex,
      degreeInSign: 0,
      house: o.house,
      nakshatra: "Ashwini",
      nakshatraIndex: 0,
      pada: 1,
      retrograde: false,
      dignity: null,
    };
  });
}

describe("computeHouseLords", () => {
  it("assigns house 1 the Ascendant's own sign, in fixed sign order thereafter", () => {
    // Ascendant = Cancer (3): house1=Cancer, house2=Leo, ... wrapping at Pisces.
    const houseLords = computeHouseLords(3, fixture({}));
    expect(houseLords[0].sign).toBe("Cancer");
    expect(houseLords[1].sign).toBe("Leo");
    expect(houseLords[11].sign).toBe("Gemini");
  });

  it("gives each house the correct classical ruling planet", () => {
    const houseLords = computeHouseLords(0, fixture({})); // Aries rising
    expect(houseLords[0].lord).toBe("Mars"); // Aries
    expect(houseLords[3].lord).toBe("Moon"); // Cancer, house 4
    expect(houseLords[9].lord).toBe("Saturn"); // Capricorn, house 10
  });

  it("finds where each house's lord actually sits in the chart", () => {
    const planets = fixture({ Mars: { house: 7, signIndex: 7 } }); // Mars in Scorpio, house 7
    const houseLords = computeHouseLords(0, planets); // Aries rising, so house1 lord = Mars
    expect(houseLords[0].lordHouse).toBe(7);
    expect(houseLords[0].lordSign).toBe("Scorpio");
  });
});
