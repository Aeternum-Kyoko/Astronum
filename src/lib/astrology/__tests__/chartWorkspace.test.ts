import { describe, expect, it } from "vitest";
import { calculateKundali } from "../kundali";
import { currentTransits } from "../transits";
import { overlayPoints } from "../chartOverlay";
import { periodsAt } from "../dashaTree";
const chart = calculateKundali({ name: "Test", date: "1990-04-12", time: "06:45", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", place: "Jaipur" });
describe("chart workspace", () => {
  it("keeps natal positions fixed when transit date changes", () => {
    const natal = JSON.stringify(chart.planets);
    const moon = chart.planets.find(p => p.planet === "Moon")!;
    const first = overlayPoints(currentTransits(moon.signIndex, chart.ascendant.signIndex, new Date("2026-10-11T06:30:00Z")), chart.ascendant.signIndex);
    const later = overlayPoints(currentTransits(moon.signIndex, chart.ascendant.signIndex, new Date("2026-11-11T06:30:00Z")), chart.ascendant.signIndex);
    expect(JSON.stringify(chart.planets)).toBe(natal);
    expect(first.find(p => p.planet === "Sun")!.signIndex).not.toBe(later.find(p => p.planet === "Sun")!.signIndex);
    expect(first.every(p => p.layer === "transit")).toBe(true);
  });
  it("places transits in natal houses across the zodiac boundary", () => {
    const transits = currentTransits(6, 0, new Date("2026-10-11T06:30:00Z"));
    const cancer = overlayPoints(transits, 3);
    expect(cancer.find(p => p.planet === "Jupiter")!.house).toBe(1); // Cancer transit in Cancer natal lagna
    expect(cancer.find(p => p.planet === "Saturn")!.house).toBe(9); // Pisces wraps around
    expect(cancer.find(p => p.planet === "Sun")!.house).toBe(3); // Virgo
  });
  it("identifies repeated lords by their date interval and switches at the exact boundary", () => {
    const cycles = [
      { lord: "Jupiter" as const, start: "2033-01-01T00:00:00Z", end: "2049-01-01T00:00:00Z" },
      { lord: "Saturn" as const, start: "2049-01-01T00:00:00Z", end: "2068-01-01T00:00:00Z" },
      { lord: "Jupiter" as const, start: "2333-01-01T00:00:00Z", end: "2349-01-01T00:00:00Z" },
    ];
    expect(periodsAt(cycles, new Date("2035-01-01T00:00:00Z"), 1)[0].start.toISOString()).toBe(new Date(cycles[0].start).toISOString());
    expect(periodsAt(cycles, new Date("2335-01-01T00:00:00Z"), 1)[0].start.toISOString()).toBe(new Date(cycles[2].start).toISOString());
    expect(periodsAt(cycles, new Date("2049-01-01T00:00:00Z"), 1)[0].lord).toBe("Saturn");
    expect(periodsAt(cycles, new Date("2200-01-01T00:00:00Z"))).toEqual([]);
  });
});
