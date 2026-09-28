import { describe, it, expect } from "vitest";
import { analyzeMangalDosha, describeMangalDosha } from "../mangalDosha";
import type { PlanetPlacement } from "../types";
import { PLANETS, SIGNS, type PlanetName } from "../constants";

// Sign indices: Aries=0 … Pisces=11. Only Mars, Moon, Venus and Jupiter matter here.
function fixture(signs: Partial<Record<PlanetName, number>>): PlanetPlacement[] {
  return PLANETS.map((planet) => {
    const signIndex = signs[planet] ?? 5;
    return {
      planet,
      siderealLongitude: signIndex * 30 + 10,
      sign: SIGNS[signIndex],
      signIndex,
      degreeInSign: 10,
      house: 1,
      nakshatra: "Ashwini",
      nakshatraIndex: 0,
      pada: 1,
      retrograde: false,
      dignity: null,
    };
  });
}

describe("analyzeMangalDosha", () => {
  it("counts the houses of Mars from the Lagna, Moon and Venus", () => {
    // Lagna Aries; Mars Cancer (4th from Lagna), Moon Gemini (2nd), Venus Leo (12th).
    const r = analyzeMangalDosha(0, fixture({ Mars: 3, Moon: 2, Venus: 4, Jupiter: 1 }));
    expect(r.houseFrom).toEqual({ Lagna: 4, Moon: 2, Venus: 12 });
    expect(r.sources).toEqual(["Lagna", "Moon", "Venus"]);
    expect(r.severity).toBe("strong");
    expect(r.status).toBe("present");
  });

  it("is absent when Mars is in no Mangal house from any reference", () => {
    // Lagna, Moon and Venus all in Aries; Mars in Gemini is the 3rd from each.
    const r = analyzeMangalDosha(0, fixture({ Mars: 2, Moon: 0, Venus: 0 }));
    expect(r.sources).toEqual([]);
    expect(r.status).toBe("absent");
    expect(describeMangalDosha(r)).toContain("not indicated");
  });

  it("grades severity by how many references flag it", () => {
    // Mars Libra: 7th from Aries Lagna; Moon Libra → 1st; Venus Virgo → 2nd.
    expect(analyzeMangalDosha(0, fixture({ Mars: 6, Moon: 6, Venus: 5, Jupiter: 1 })).severity).toBe("strong");
    // Moon Aquarius → 9th, Venus Sagittarius → 11th: only the Lagna flags it.
    expect(analyzeMangalDosha(0, fixture({ Mars: 6, Moon: 10, Venus: 8, Jupiter: 1 })).severity).toBe("mild");
  });

  it("cancels when Mars is in its own or exaltation sign", () => {
    // Lagna Libra, Mars Aries → 7th from Lagna, own sign.
    const r = analyzeMangalDosha(6, fixture({ Mars: 0, Moon: 3, Venus: 3, Jupiter: 1 }));
    expect(r.sources).toContain("Lagna");
    expect(r.status).toBe("cancelled");
    expect(r.cancellations[0]).toMatch(/own sign/);

    const exalted = analyzeMangalDosha(3, fixture({ Mars: 9, Moon: 3, Venus: 3, Jupiter: 1 }));
    expect(exalted.cancellations[0]).toMatch(/exaltation/);
  });

  it("cancels when Jupiter is conjunct or aspects Mars", () => {
    // Lagna Aries, Mars Cancer (4th). Jupiter in Cancer → conjunct.
    expect(analyzeMangalDosha(0, fixture({ Mars: 3, Moon: 5, Venus: 5, Jupiter: 3 })).cancellations[0]).toMatch(
      /conjunct Jupiter/
    );
    // Jupiter in Scorpio: Cancer is the 9th from Scorpio → Jupiter's 9th aspect.
    expect(analyzeMangalDosha(0, fixture({ Mars: 3, Moon: 5, Venus: 5, Jupiter: 7 })).status).toBe("cancelled");
    // Jupiter in Taurus: Cancer is the 3rd from Taurus → no aspect.
    expect(analyzeMangalDosha(0, fixture({ Mars: 3, Moon: 5, Venus: 5, Jupiter: 1 })).status).toBe("present");
  });
});
