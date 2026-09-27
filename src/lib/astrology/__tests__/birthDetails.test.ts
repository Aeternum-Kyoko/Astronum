import { describe, it, expect } from "vitest";
import { computeAvakahada, computeBirthPanchang, isCombust } from "../birthDetails";
import type { PlanetPlacement } from "../types";

describe("computeBirthPanchang", () => {
  it("reads a new Moon as the first half of Shukla Pratipada", () => {
    const p = computeBirthPanchang(100, 103);
    expect(p).toMatchObject({ tithi: "Pratipada", tithiNumber: 1, paksha: "Shukla", karana: "Kimstughna" });
  });

  it("names the 15th tithi Purnima and the 30th Amavasya", () => {
    expect(computeBirthPanchang(0, 175).tithi).toBe("Purnima");
    expect(computeBirthPanchang(0, 355).tithi).toBe("Amavasya");
    expect(computeBirthPanchang(0, 355).paksha).toBe("Krishna");
  });

  it("wraps the elongation across 0° Aries", () => {
    // Moon 20° ahead of the Sun, straddling the zodiac start.
    expect(computeBirthPanchang(350, 10).tithiNumber).toBe(2);
  });

  it("uses the fixed closing karanas at the end of the month", () => {
    expect(computeBirthPanchang(0, 343).karana).toBe("Shakuni");
    expect(computeBirthPanchang(0, 349).karana).toBe("Chatushpada");
    expect(computeBirthPanchang(0, 355).karana).toBe("Naga");
  });

  it("cycles the movable karanas starting from Bava", () => {
    expect(computeBirthPanchang(0, 7).karana).toBe("Bava");
    expect(computeBirthPanchang(0, 43).karana).toBe("Vishti");
    expect(computeBirthPanchang(0, 49).karana).toBe("Bava");
  });

  it("derives the nitya yoga from the Sun + Moon sum", () => {
    expect(computeBirthPanchang(0, 1).yoga).toBe("Vishkambha");
    expect(computeBirthPanchang(180, 179).yoga).toBe("Vaidhriti");
  });
});

describe("computeAvakahada", () => {
  it("gives the standard values for a Moon in Ashwini, Aries", () => {
    expect(computeAvakahada({ signIndex: 0, degreeInSign: 5, nakshatraIndex: 0 })).toEqual({
      varna: "Kshatriya",
      vashya: "Chatushpada",
      yoni: "Horse",
      gana: "Deva",
      nadi: "Adi",
      signLord: "Mars",
      nakshatraLord: "Ketu",
    });
  });

  it("gives the standard values for a Moon in Revati, Pisces", () => {
    expect(computeAvakahada({ signIndex: 11, degreeInSign: 25, nakshatraIndex: 26 })).toMatchObject({
      varna: "Brahmin",
      vashya: "Jalachara",
      yoni: "Elephant",
      gana: "Deva",
      nadi: "Antya",
      nakshatraLord: "Mercury",
    });
  });

  it("follows the Nadi snake pattern through the middle nakshatras", () => {
    expect(computeAvakahada({ signIndex: 4, degreeInSign: 5, nakshatraIndex: 9 }).nadi).toBe("Antya"); // Magha
    expect(computeAvakahada({ signIndex: 5, degreeInSign: 5, nakshatraIndex: 11 }).nadi).toBe("Adi"); // U. Phalguni
    expect(computeAvakahada({ signIndex: 10, degreeInSign: 10, nakshatraIndex: 23 }).nadi).toBe("Adi"); // Shatabhisha
  });

  it("splits Vashya by half-sign for Sagittarius and Capricorn", () => {
    expect(computeAvakahada({ signIndex: 8, degreeInSign: 10, nakshatraIndex: 18 }).vashya).toBe("Manava");
    expect(computeAvakahada({ signIndex: 8, degreeInSign: 20, nakshatraIndex: 19 }).vashya).toBe("Chatushpada");
    expect(computeAvakahada({ signIndex: 9, degreeInSign: 10, nakshatraIndex: 20 }).vashya).toBe("Chatushpada");
    expect(computeAvakahada({ signIndex: 9, degreeInSign: 20, nakshatraIndex: 21 }).vashya).toBe("Jalachara");
  });
});

function placement(planet: PlanetPlacement["planet"], lon: number, retrograde = false): PlanetPlacement {
  return {
    planet,
    siderealLongitude: lon,
    sign: "Aries",
    signIndex: 0,
    degreeInSign: 0,
    house: 1,
    nakshatra: "Ashwini",
    nakshatraIndex: 0,
    pada: 1,
    retrograde,
    dignity: null,
  };
}

describe("isCombust", () => {
  const sun = placement("Sun", 100);

  it("flags planets inside their orb on either side of the Sun", () => {
    expect(isCombust(placement("Saturn", 114), sun)).toBe(true);
    expect(isCombust(placement("Saturn", 86), sun)).toBe(true);
    expect(isCombust(placement("Jupiter", 112), sun)).toBe(false);
  });

  it("tightens the orb for retrograde Venus and Mercury", () => {
    expect(isCombust(placement("Venus", 109), sun)).toBe(true);
    expect(isCombust(placement("Venus", 109, true), sun)).toBe(false);
    expect(isCombust(placement("Mercury", 113, true), sun)).toBe(false);
  });

  it("handles separation across 0° Aries", () => {
    expect(isCombust(placement("Mars", 5), placement("Sun", 355))).toBe(true);
  });

  it("never marks the Sun or the nodes combust", () => {
    expect(isCombust(sun, sun)).toBe(false);
    expect(isCombust(placement("Rahu", 101), sun)).toBe(false);
  });
});
