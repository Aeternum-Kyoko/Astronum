import { describe, it, expect } from "vitest";
import { bhavaOf, sripatiBhavas } from "../bhavaChalit";

describe("sripatiBhavas", () => {
  it("reduces to equal 30° houses centred on the Ascendant when the MC is exactly 90° behind it", () => {
    const b = sripatiBhavas(100, 10);
    b.forEach((bhava, i) => {
      expect(bhava.madhya).toBeCloseTo((100 + i * 30) % 360, 6);
      expect(bhava.start).toBeCloseTo((85 + i * 30) % 360, 6);
    });
  });

  it("puts the angles at the madhyas of houses 1, 4, 7 and 10", () => {
    const b = sripatiBhavas(15, 290);
    expect(b[0].madhya).toBeCloseTo(15);
    expect(b[3].madhya).toBeCloseTo(110); // IC
    expect(b[6].madhya).toBeCloseTo(195); // Descendant
    expect(b[9].madhya).toBeCloseTo(290); // MC
  });

  it("tiles the whole zodiac with unequal houses when the quadrants differ", () => {
    const b = sripatiBhavas(15, 290);
    const total = b.reduce((sum, bhava, i) => sum + ((b[(i + 1) % 12].start - bhava.start + 360) % 360), 0);
    expect(total).toBeCloseTo(360, 6);
    const widths = b.map((bhava, i) => (b[(i + 1) % 12].start - bhava.start + 360) % 360);
    expect(new Set(widths.map((w) => w.toFixed(3))).size).toBeGreaterThan(1);
  });
});

describe("bhavaOf", () => {
  const b = sripatiBhavas(100, 10); // equal houses, house 1 = 85°–115°

  it("assigns longitudes by sandhi, not by sign", () => {
    expect(bhavaOf(100, b)).toBe(1);
    expect(bhavaOf(86, b)).toBe(1);
    expect(bhavaOf(84, b)).toBe(12);
    expect(bhavaOf(116, b)).toBe(2);
  });

  it("wraps across 0° Aries", () => {
    // House 10 madhya = 10°, spanning 355°–25°.
    expect(bhavaOf(358, b)).toBe(10);
    expect(bhavaOf(20, b)).toBe(10);
  });
});
