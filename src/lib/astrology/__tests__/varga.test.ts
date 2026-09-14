import { describe, it, expect } from "vitest";
import { computeVarga } from "../varga";
import { navamsaSignIndex } from "../navamsa";
import { VARGA_KEYS } from "../constants";

describe("computeVarga — D1 is always identity", () => {
  it.each([0, 10, 45.5, 123, 200, 359.9])("returns the same sign as floor(longitude/30) for %d°", (lon) => {
    expect(computeVarga("D1", lon)).toBe(Math.floor(lon / 30) % 12);
  });
});

describe("computeVarga — D2 Hora", () => {
  it("gives an odd sign's first half to Leo and second half to Cancer", () => {
    expect(computeVarga("D2", 5)).toBe(4); // Aries 5° (odd sign, first half) -> Leo
    expect(computeVarga("D2", 20)).toBe(3); // Aries 20° (odd sign, second half) -> Cancer
  });

  it("gives an even sign's first half to Cancer and second half to Leo", () => {
    expect(computeVarga("D2", 35)).toBe(3); // Taurus 5° (even sign, first half) -> Cancer
    expect(computeVarga("D2", 50)).toBe(4); // Taurus 20° (even sign, second half) -> Leo
  });
});

describe("computeVarga — D3 Drekkana", () => {
  it("keeps the 1st drekkana in the same sign", () => {
    expect(computeVarga("D3", 5)).toBe(0); // Aries 5° -> Aries
  });

  it("sends the 2nd drekkana to the 5th sign onward", () => {
    expect(computeVarga("D3", 15)).toBe(4); // Aries 15° -> Leo (5th from Aries)
  });

  it("sends the 3rd drekkana to the 9th sign onward", () => {
    expect(computeVarga("D3", 25)).toBe(8); // Aries 25° -> Sagittarius (9th from Aries)
  });
});

describe("computeVarga — D9 Navamsa matches the dedicated navamsa formula", () => {
  it.each([0, 30, 60, 123.4, 200])("agrees for longitude %d°", (lon) => {
    expect(computeVarga("D9", lon)).toBe(navamsaSignIndex(lon));
  });

  it("starts a movable sign's navamsas from itself", () => {
    expect(computeVarga("D9", 0)).toBe(0); // Aries 0° -> Aries
  });
});

describe("computeVarga — D10 Dasamsa", () => {
  it("has an odd sign start counting from itself", () => {
    expect(computeVarga("D10", 0)).toBe(0); // Aries 0° -> Aries (1st dasamsa)
  });

  it("has an even sign start counting from its own 9th", () => {
    expect(computeVarga("D10", 30)).toBe(9); // Taurus 0° -> Capricorn (9th from Taurus)
  });
});

describe("computeVarga — D30 Trimsamsa (unequal divisions)", () => {
  it("gives Aries 0-5° (odd sign, Mars span) to Aries itself", () => {
    expect(computeVarga("D30", 2)).toBe(0);
  });

  it("gives Aries 27° (odd sign, Venus span) to Libra", () => {
    expect(computeVarga("D30", 27)).toBe(6);
  });

  it("gives Taurus 2° (even sign, Venus span) to Taurus itself", () => {
    expect(computeVarga("D30", 32)).toBe(1);
  });

  it("gives Taurus 27° (even sign, Mars span) to Scorpio", () => {
    expect(computeVarga("D30", 57)).toBe(7);
  });
});

describe("computeVarga — every division returns a valid sign index across the whole zodiac", () => {
  it.each(VARGA_KEYS)("%s stays within 0..11 for every tenth of a degree", (key) => {
    for (let tenth = 0; tenth < 3600; tenth += 7) {
      const signIndex = computeVarga(key, tenth / 10);
      expect(signIndex).toBeGreaterThanOrEqual(0);
      expect(signIndex).toBeLessThan(12);
    }
  });
});
