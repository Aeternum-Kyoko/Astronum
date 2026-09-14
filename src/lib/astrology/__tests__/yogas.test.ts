import { describe, it, expect } from "vitest";
import { detectYogas } from "../yogas";
import type { PlanetPlacement } from "../types";
import { PLANETS, SIGNS, type PlanetName } from "../constants";
import { getDignity } from "../dignity";

/** Builds a full 9-planet placement set; overrides put specific planets at specific house/sign. */
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
      dignity: getDignity(planet, o.signIndex),
    };
  });
}

function yoga(name: string, planets: PlanetPlacement[]) {
  return detectYogas(planets, 0).find((y) => y.name.startsWith(name))!;
}

describe("Panch Mahapurusha yogas", () => {
  it("flags Ruchaka Yoga when Mars is in a kendra in its own sign", () => {
    const planets = fixture({ Mars: { house: 4, signIndex: 0 } }); // Aries = Mars's own sign
    expect(yoga("Ruchaka", planets).present).toBe(true);
  });

  it("does not flag Ruchaka Yoga when Mars is in a kendra but a neutral sign", () => {
    const planets = fixture({ Mars: { house: 4, signIndex: 2 } }); // Gemini = neutral for Mars
    expect(yoga("Ruchaka", planets).present).toBe(false);
  });

  it("does not flag Ruchaka Yoga when Mars is exalted but not in a kendra", () => {
    const planets = fixture({ Mars: { house: 5, signIndex: 9 } }); // Capricorn (exalted) but house 5
    expect(yoga("Ruchaka", planets).present).toBe(false);
  });

  it("flags Hamsa Yoga when Jupiter is exalted in a kendra", () => {
    const planets = fixture({ Jupiter: { house: 10, signIndex: 3 } }); // Cancer = Jupiter exalted
    expect(yoga("Hamsa", planets).present).toBe(true);
  });
});

describe("Gaj Kesari Yoga", () => {
  it("is present when Jupiter is a kendra away from the Moon", () => {
    const planets = fixture({ Moon: { house: 1, signIndex: 0 }, Jupiter: { house: 4, signIndex: 3 } });
    expect(yoga("Gaj Kesari", planets).present).toBe(true);
  });

  it("is absent when Jupiter is not a kendra away from the Moon", () => {
    const planets = fixture({ Moon: { house: 1, signIndex: 0 }, Jupiter: { house: 2, signIndex: 1 } });
    expect(yoga("Gaj Kesari", planets).present).toBe(false);
  });
});

describe("Chandra-Mangal Yoga", () => {
  it("is present when Moon and Mars share a sign", () => {
    const planets = fixture({ Moon: { house: 3, signIndex: 5 }, Mars: { house: 3, signIndex: 5 } });
    expect(yoga("Chandra-Mangal", planets).present).toBe(true);
  });

  it("is absent when Moon and Mars are in different signs", () => {
    const planets = fixture({ Moon: { house: 3, signIndex: 5 }, Mars: { house: 8, signIndex: 10 } });
    expect(yoga("Chandra-Mangal", planets).present).toBe(false);
  });
});

describe("Kemadruma Yoga", () => {
  it("is present when nothing (besides the Sun) flanks the Moon", () => {
    // Moon in Cancer(3); flanking signs are Gemini(2) and Leo(4). Put every
    // other planet far away.
    const planets = fixture({
      Moon: { house: 1, signIndex: 3 },
      Sun: { house: 1, signIndex: 2 }, // Sun doesn't count, even though it's flanking
      Mars: { house: 6, signIndex: 8 },
      Mercury: { house: 6, signIndex: 8 },
      Jupiter: { house: 6, signIndex: 8 },
      Venus: { house: 6, signIndex: 8 },
      Saturn: { house: 6, signIndex: 8 },
    });
    expect(yoga("Kemadruma", planets).present).toBe(true);
  });

  it("is cancelled when a planet (other than the Sun) flanks the Moon", () => {
    const planets = fixture({
      Moon: { house: 1, signIndex: 3 },
      Mercury: { house: 2, signIndex: 4 }, // Leo, 2nd from Moon
    });
    expect(yoga("Kemadruma", planets).present).toBe(false);
  });
});
