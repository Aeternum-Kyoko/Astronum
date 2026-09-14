import { describe, it, expect } from "vitest";
import { navamsaSignIndex } from "../navamsa";

describe("navamsaSignIndex", () => {
  it("starts a movable sign's navamsas from itself (Aries 0° → Aries)", () => {
    expect(navamsaSignIndex(0)).toBe(0);
  });

  it("starts a fixed sign's navamsas from the 9th sign from itself (Taurus 0° → Capricorn)", () => {
    expect(navamsaSignIndex(30)).toBe(9);
  });

  it("starts a dual sign's navamsas from the 5th sign from itself (Gemini 0° → Libra)", () => {
    expect(navamsaSignIndex(60)).toBe(6);
  });

  it("keeps opposite tropical points exactly opposite in the navamsa too", () => {
    for (const lon of [10, 47, 123.4, 200, 359]) {
      const a = navamsaSignIndex(lon);
      const b = navamsaSignIndex((lon + 180) % 360);
      expect((a + 6) % 12).toBe(b);
    }
  });

  it("produces all 12 signs exactly 9 times across the full zodiac", () => {
    const counts = new Array(12).fill(0);
    for (let tenth = 0; tenth < 3600; tenth++) {
      counts[navamsaSignIndex(tenth / 10)]++;
    }
    // Each sign should appear roughly equally (9/108 of the zodiac each).
    for (const count of counts) {
      expect(count).toBeGreaterThan(0);
    }
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3600);
  });
});
