import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { computeVarshphal, solarReturn } from "../varshphal";
import { siderealLongitude } from "../ephemeris";
import { NAMAKSHAR } from "../namakshar";

const input = { name: "T", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" };
const natal = calculateKundali(input);

describe("solarReturn", () => {
  it("finds the moment the Sun is back at its natal longitude, near the birthday", () => {
    const natalSun = natal.planets.find((p) => p.planet === "Sun")!.siderealLongitude;
    const t = solarReturn(natalSun, new Date(natal.utcDate), 2026);
    expect(Math.abs(siderealLongitude("Sun", t) - natalSun)).toBeLessThan(0.001);
    expect(t.getUTCFullYear()).toBe(2026);
    expect(Math.abs(t.getTime() - Date.parse("2026-04-12"))).toBeLessThan(3 * 86400_000);
  });
});

describe("computeVarshphal", () => {
  it("advances the Muntha one sign a year from the natal Lagna", () => {
    const v = computeVarshphal(input, natal, 2026);
    expect(v.age).toBe(36);
    expect(v.muntha.signIndex).toBe((natal.ascendant.signIndex + 36) % 12);
    expect(v.chart.planets.find((p) => p.planet === "Sun")!.sign).toBe(natal.planets.find((p) => p.planet === "Sun")!.sign);
  });
});

describe("NAMAKSHAR", () => {
  it("has four syllables for each of the 27 nakshatras", () => {
    expect(NAMAKSHAR).toHaveLength(27);
    for (const n of NAMAKSHAR) expect(n).toHaveLength(4);
  });
});
