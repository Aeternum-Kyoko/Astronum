import { describe, expect, it } from "vitest";
import { calculateKundali } from "../kundali";
import { chartRelationships, inspectChart } from "../chartInspection";
import { VARGA_KEYS } from "../constants";
const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
const at = new Date("2026-10-12T06:30:00Z");
describe("connected chart inspection", () => {
  it.each(VARGA_KEYS)("keeps %s conjunctions separate from incoming aspects", key => {
    const source = key === "D1" ? chart.planets : chart.divisionalCharts[key].planets;
    for (const planet of source) {
      const detail = inspectChart(chart, key, { kind:"planet", planet:planet.planet }, at);
      expect(detail.conjunctPlanets.map(p => p.planet).sort()).toEqual(source.filter(p => p.signIndex === planet.signIndex && p.planet !== planet.planet).map(p => p.planet).sort());
      expect(detail.incoming.every(p => p.signIndex !== planet.signIndex)).toBe(true);
      for (const group of detail.conjunctionReadings) {
        expect(group.planets).toContain(planet.planet);
        expect(group.house).toBe(detail.house);
      }
      if (key === "D2") expect(detail.conjunctionReadings).toEqual([]);
    }
  });
  it.each(VARGA_KEYS)("projects %s selection, occupants, lord and aspects from one calculation", key => {
    for (const planet of chart.planets) {
      const detail = inspectChart(chart, key, { kind: "planet", planet: planet.planet }, at);
      expect(chartRelationships(detail)).toEqual({
        focusHouse: detail.house,
        lord: detail.lord,
        occupants: detail.occupants.map(item => item.planet),
        incoming: detail.incoming.map(item => ({ planet: item.planet, house: item.house })),
        outgoing: detail.outgoing,
      });
    }
  });
  it.each(VARGA_KEYS)("uses %s placements and keeps planet/house navigation consistent", key => {
    const source = key === "D1" ? chart : chart.divisionalCharts[key];
    for (const p of source.planets) {
      const result = inspectChart(chart, key, { kind: "planet", planet: p.planet }, at);
      const expectedHouse = ((p.signIndex - source.ascendant.signIndex + 12) % 12) + 1;
      expect(result.planet?.signIndex).toBe(p.signIndex);
      expect(result.house).toBe(expectedHouse);
      const house = inspectChart(chart, key, { kind: "house", house: expectedHouse }, at);
      expect(house.occupants.map(p => p.planet)).toContain(p.planet);
      expect(house.incoming).toEqual(result.incoming);
      expect(result.natal).toEqual(chart.planets.find(n => n.planet === p.planet));
      for (const target of result.outgoing) {
        expect(inspectChart(chart, key, { kind: "house", house: target }, at).incoming.map(p => p.planet)).toContain(p.planet);
      }
    }
  });
  it("does not reuse natal houses for the D10 reading", () => {
    const changed = chart.divisionalCharts.D10.planets.find(p => p.house !== chart.planets.find(n => n.planet === p.planet)!.house)!;
    expect(changed).toBeDefined();
    const detail = inspectChart(chart, "D10", { kind: "planet", planet: changed.planet }, at);
    expect(detail.planetReading?.house).toBe(changed.house);
    expect(detail.planetReading?.house).not.toBe(detail.natal?.house);
  });
  it("does not invent twelve-house interpretations for the two-sign Hora", () => {
    const detail = inspectChart(chart, "D2", { kind: "planet", planet: "Sun" }, at);
    expect(detail.planetReading).toBeNull();
    expect(detail.houseReading).toBeNull();
  });
  it("retains a lord and its location for empty houses", () => {
    const detail = Array.from({ length: 12 }, (_, i) => inspectChart(chart, "D9", { kind: "house", house: i + 1 }, at)).find(h => !h.occupants.length)!;
    expect(detail.lordPlacement.planet).toBe(detail.lord);
    expect(detail.houseReading?.lordHouse).toBe(detail.lordPlacement.house);
  });
  it("only exposes active natal periods relevant to the selection", () => {
    for (const p of chart.planets) {
      const detail = inspectChart(chart, "D9", { kind: "planet", planet: p.planet }, at);
      for (const period of detail.periods) {
        expect(period.lord).toBe(p.planet);
        expect(period.start.getTime()).toBeLessThanOrEqual(at.getTime());
        expect(period.end.getTime()).toBeGreaterThan(at.getTime());
      }
    }
  });
});
