import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { computeCompatibility, RELATIONSHIP_TYPES } from "../compatibility";

const asha = calculateKundali({ name: "Asha", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const ravi = calculateKundali({ name: "Ravi", date: "1988-11-02", time: "14:20", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata", place: "Mumbai" });

describe("computeCompatibility", () => {
  it.each(RELATIONSHIP_TYPES)("weights the %s checkpoints to exactly 100", (type) => {
    const r = computeCompatibility(type, asha, ravi);
    expect(r.checkpoints.reduce((s, c) => s + c.max, 0)).toBe(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    for (const c of r.checkpoints) {
      expect(c.points).toBeLessThanOrEqual(c.max);
      expect(c.detail.length).toBeGreaterThan(10);
    }
  });

  it.each(RELATIONSHIP_TYPES)("gives the same %s score whichever person is entered first", (type) => {
    expect(computeCompatibility(type, asha, ravi).score).toBe(computeCompatibility(type, ravi, asha).score);
  });

  it("uses purpose-specific checkpoints", () => {
    const keys = (t: (typeof RELATIONSHIP_TYPES)[number]) => computeCompatibility(t, asha, ravi).checkpoints.map((c) => c.key);
    expect(keys("business")).toEqual(expect.arrayContaining(["mercury", "wealth", "partnership", "timing"]));
    expect(keys("friendship")).toEqual(expect.arrayContaining(["bonds", "jupiter-moon"]));
    expect(keys("romance")).toEqual(expect.arrayContaining(["attraction", "yoni", "romance-houses", "mangal"]));
    // Nadi (progeny) and Yoni (intimacy) have no place in a business match.
    expect(keys("business")).not.toContain("yoni");
    expect(keys("business")).not.toContain("nadi");
  });

  it("scores two identical charts' Moon signs as the same-sign pairing", () => {
    const moon = computeCompatibility("friendship", asha, asha).checkpoints.find((c) => c.key === "moon")!;
    expect(moon.detail).toMatch(/the same sign/);
  });

  it("labels the overall result from the score", () => {
    const r = computeCompatibility("business", asha, ravi);
    const expected = r.score >= 75 ? "Excellent" : r.score >= 60 ? "Good" : r.score >= 45 ? "Workable" : "Challenging";
    expect(r.label).toBe(expected);
  });
});
