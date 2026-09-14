import { describe, it, expect } from "vitest";
import { getDignity } from "../dignity";

// Sign indices: Aries=0, Taurus=1, Gemini=2, Cancer=3, Leo=4, Virgo=5,
// Libra=6, Scorpio=7, Sagittarius=8, Capricorn=9, Aquarius=10, Pisces=11.

describe("getDignity — classical exaltation/debilitation pairs", () => {
  it("exalts the Sun in Aries and debilitates it in Libra", () => {
    expect(getDignity("Sun", 0)).toBe("Exalted");
    expect(getDignity("Sun", 6)).toBe("Debilitated");
  });

  it("exalts the Moon in Taurus and debilitates it in Scorpio", () => {
    expect(getDignity("Moon", 1)).toBe("Exalted");
    expect(getDignity("Moon", 7)).toBe("Debilitated");
  });

  it("exalts Jupiter in Cancer and debilitates it in Capricorn", () => {
    expect(getDignity("Jupiter", 3)).toBe("Exalted");
    expect(getDignity("Jupiter", 9)).toBe("Debilitated");
  });

  it("exalts Saturn in Libra and debilitates it in Aries", () => {
    expect(getDignity("Saturn", 6)).toBe("Exalted");
    expect(getDignity("Saturn", 0)).toBe("Debilitated");
  });

  it("exalts Mars in Capricorn and debilitates it in Cancer", () => {
    expect(getDignity("Mars", 9)).toBe("Exalted");
    expect(getDignity("Mars", 3)).toBe("Debilitated");
  });

  it("exalts Venus in Pisces and debilitates it in Virgo", () => {
    expect(getDignity("Venus", 11)).toBe("Exalted");
    expect(getDignity("Venus", 5)).toBe("Debilitated");
  });

  it("exalts Mercury in Virgo and debilitates it in Pisces", () => {
    expect(getDignity("Mercury", 5)).toBe("Exalted");
    expect(getDignity("Mercury", 11)).toBe("Debilitated");
  });
});

describe("getDignity — own signs", () => {
  it.each([
    ["Sun", 4],
    ["Moon", 3],
    ["Mars", 0],
    ["Mars", 7],
    ["Mercury", 2],
    ["Jupiter", 8],
    ["Venus", 1],
    ["Saturn", 10],
  ] as const)("%s is at home in its own sign %i", (planet, sign) => {
    expect(getDignity(planet, sign)).toBe("Own Sign");
  });
});

describe("getDignity — natural friendship asymmetries", () => {
  it("treats Mercury as neutral to the Sun (not a friend) despite the Sun favoring Mercury's neighbors", () => {
    // Sun's sign is Leo; Mercury sits in Gemini/Virgo, ruled by itself — check Sun's
    // view of Mercury directly via a sign Mercury rules.
    expect(getDignity("Sun", 2)).toBe("Neutral Sign"); // Gemini, ruled by Mercury
  });

  it("gives the Moon no enemy signs at all", () => {
    for (let sign = 0; sign < 12; sign++) {
      expect(getDignity("Moon", sign)).not.toBe("Enemy's Sign");
    }
  });

  it("has Saturn regard Mars as an enemy (Aries/Scorpio are Saturn's enemy signs)", () => {
    expect(getDignity("Saturn", 7)).toBe("Enemy's Sign"); // Scorpio, ruled by Mars
  });
});

describe("getDignity — Moolatrikona (needs a degree, not just a sign)", () => {
  it("gives the Sun Moolatrikona in the first 20° of Leo when a degree is supplied", () => {
    expect(getDignity("Sun", 4, 10)).toBe("Moolatrikona");
  });

  it("falls back to plain Own Sign in the rest of Leo", () => {
    expect(getDignity("Sun", 4, 25)).toBe("Own Sign");
  });

  it("falls back to plain Own Sign when no degree is supplied at all", () => {
    expect(getDignity("Sun", 4)).toBe("Own Sign");
  });

  it("gives Mars Moolatrikona only in Aries 0-12°, not the rest of Aries or Scorpio", () => {
    expect(getDignity("Mars", 0, 5)).toBe("Moolatrikona");
    expect(getDignity("Mars", 0, 20)).toBe("Own Sign");
    expect(getDignity("Mars", 7, 5)).toBe("Own Sign");
  });
});

describe("getDignity — lunar nodes", () => {
  it("returns null for Rahu and Ketu (no settled classical dignity rule)", () => {
    expect(getDignity("Rahu", 0)).toBeNull();
    expect(getDignity("Ketu", 6)).toBeNull();
  });
});
