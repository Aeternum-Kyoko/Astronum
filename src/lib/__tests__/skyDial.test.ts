import { describe, expect, it } from "vitest";
import { skyDegreeText, skyLabelAngles, type SkyPosition } from "../skyDial";
import { skyNow } from "../skySnapshot";
import { siderealLongitude } from "../astrology/ephemeris";

describe("readable sky labels", () => {
  it.each([[359, 0, 1, 2, 3, 4, 5, 6, 7], [0, 0, 0, 0, 0, 0, 0, 0, 0], [12, 51, 90, 140, 170, 210, 250, 290, 340]])("separates crowded labels including across Aries zero: %j", (...longitudes) => {
    const names: SkyPosition["planet"][] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
    const positions = names.map((planet, i) => ({ planet, longitude: longitudes[i] }));
    const before = structuredClone(positions);
    const result = [...skyLabelAngles(positions).values()];
    expect(positions).toEqual(before);
    for (let i = 0; i < result.length; i++) for (let j = i + 1; j < result.length; j++) {
      const gap = Math.abs(result[i] - result[j]);
      expect(Math.min(gap, 360 - gap)).toBeGreaterThanOrEqual(24 - 1e-8);
    }
  });
  it("does not round a near-boundary longitude into the next sign", () => {
    expect(skyDegreeText(29.999999)).toBe("29° 59′");
    expect(skyDegreeText(30)).toBe("0° 00′");
    expect(skyDegreeText(359.999999)).toBe("29° 59′");
  });
});

describe("sky snapshot", () => {
  it("matches the established ephemeris and keeps the mean nodes opposite", () => {
    const at = new Date("2026-10-24T09:30:00Z");
    const sky = skyNow(at);
    for (const p of sky.positions) expect(p.longitude).toBeCloseTo(siderealLongitude(p.planet, at), 9);
    const rahu = sky.positions.find(p => p.planet === "Rahu")!.longitude;
    const ketu = sky.positions.find(p => p.planet === "Ketu")!.longitude;
    expect((ketu - rahu + 360) % 360).toBeCloseTo(180, 9);
  });
});
