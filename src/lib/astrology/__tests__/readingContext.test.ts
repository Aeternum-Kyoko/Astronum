import { describe, expect, it } from "vitest";
import { calculateKundali } from "../kundali";
import { readingContext, SECTION_LENSES } from "../readingContext";
import { houseReadings } from "../houseReadings";

const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const now = new Date("2026-10-10T12:00:00Z");

describe("shared Kundli evidence", () => {
  it("uses each varga's own placement and preserves D1 house ownership", () => {
    const career = readingContext(chart, [10], ["D10"], now)[0];
    expect(career.lord).toEqual(chart.houseLords.find((h) => h.house === 10));
    expect(career.vargas[0].placement).toEqual(chart.divisionalCharts.D10.planets.find((p) => p.planet === career.lord.lord));
    expect(career.bindus).toBe(chart.ashtakavarga.sarva[(chart.ascendant.signIndex + 9) % 12]);
  });

  it("reflects strength and Chalit changes rather than recycling static text", () => {
    const original = readingContext(chart, [10], [], now)[0];
    const changed = { ...chart, chalitHouses: chart.chalitHouses.map((p) => p.planet === original.lord.lord ? { ...p, house: 12 } : p), shadbala: chart.shadbala.map((p) => p.planet === original.lord.lord ? { ...p, rupas: 0.1, isStrong: false } : p) };
    const result = readingContext(changed, [10], [], now)[0];
    expect(result.chalitHouse).toBe(12);
    expect(result.strength?.isStrong).toBe(false);
    const reading = houseReadings(changed, now)[9];
    expect(reading.lordText).toContain("0.10 rupas");
    expect(reading.lordText).toContain("In D9");
  });

  it("covers every Kundli section with valid topic-specific house lenses", () => {
    expect(Object.keys(SECTION_LENSES)).toHaveLength(37);
    for (const lens of Object.values(SECTION_LENSES)) {
      expect(lens.houses.every((h) => h >= 1 && h <= 12)).toBe(true);
      expect(readingContext(chart, lens.houses, lens.vargas, now)).toHaveLength(lens.houses.length);
    }
  });
});
